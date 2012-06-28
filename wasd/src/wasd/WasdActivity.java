package wasd;

import grits.wasd.R;

import java.io.IOException;

import org.apache.http.client.HttpClient;
import org.apache.http.client.HttpResponseException;
import org.apache.http.client.ResponseHandler;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.conn.HttpHostConnectException;
import org.apache.http.impl.client.BasicResponseHandler;
import org.apache.http.impl.client.DefaultHttpClient;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONTokener;

import android.accounts.Account;
import android.accounts.AccountManager;
import android.accounts.AccountManagerCallback;
import android.accounts.AccountManagerFuture;
import android.accounts.OperationCanceledException;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.DialogInterface.OnCancelListener;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.AsyncTask;
import android.os.Bundle;
import android.util.Log;
import android.view.Display;
import android.view.Surface;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.Toast;

import com.clwillingham.socket.io.IOSocket;
import com.clwillingham.socket.io.MessageCallback;

/**
 * Main activity for the Grits WASD controller.
 */
public class WasdActivity extends Activity {

  /**
   * Tag used for logging.
   */
  public static final String TAG = WasdActivity.class.getName();

  /**
   * Local IP address for testing with the dev_appserver.
   */
  private static final String LOCAL_IP = "192.168.21.28";

  /**
   * The production origin.
   */
  private static final String ORIGIN_GRITSGAME_APPSPOT_COM = "http://gritsgame.appspot.com";

  /**
   * The dev_appserver origin.
   */
  private static final String ORIGIN_LOCAL = "http://" + LOCAL_IP + ":8080";

  //  private static final String HTTPS_WWW_GOOGLEAPIS_COM_PLUS_V1_PEOPLE_ME = "https://www.googleapis.com/plus/v1/people/me";

  /**
   * The user info API endpoint, which allows us to retrieve the same user id as is returned by App
   * Engine's OAuth2 API for the {@value SCOPE_USERINFO_EMAIL} scope.
   */
  private static final String HTTPS_WWW_GOOGLEAPIS_COM_OAUTH2_V1_USERINFO = "https://www.googleapis.com/oauth2/v1/userinfo";

  /**
   * Preference key where the current account is stored.
   */
  private static final String PREF_ACCOUNT_NAME = "ACCOUNT_NAME";

  /**
   * Preference key prefix where the OAuth2 {@value SCOPE_USERINFO_EMAIL} scope access token is
   * stored.
   */
  private static final String PREF_OAUTH2_EMAIL_ACCESS_TOKEN_ = "OAUTH2_EMAIL_ACCESS_TOKEN_";

  /**
   * Preference key prefix where the OAuth2 {@value SCOPE_USERINFO_PROFILE} scope access token is
   * stored.
   */
  private static final String PREF_OAUTH2_PROFILE_ACCESS_TOKEN_ = "OAUTH2_PROFILE_ACCESS_TOKEN_";

  /**
   * Preference key where the preferred game origin is stored.
   */
  protected static final String PREF_GAME_ORIGIN = "GAME_ORIGIN";

  /**
   * Determines accelerometer sensitivity, i.e. how far the device must be tilted from level before
   * a directional change is detected.
   */
  public static final float SENSOR_THRESHOLD = 2f;

  /**
   * Limits flip flopping of the accelerometer directional state, by requiring a lower sensor
   * reading to turn off a particular directional input than is required to enable the same
   * directional input.
   */
  private static final float SENSOR_STICKINESS = 0.3f;

  // private static final String SCOPE_PLUS_ME = "oauth2:https://www.googleapis.com/auth/plus.me";

  /**
   * OAuth2 scope which provides access to the user id and email address.
   */
  private static final String SCOPE_USERINFO_EMAIL = "oauth2:https://www.googleapis.com/auth/userinfo.email";

  /**
   * OAuth2 scope which provides access to the user's basic profile information, although not the
   * email address.
   */
  private static final String SCOPE_USERINFO_PROFILE = "oauth2:https://www.googleapis.com/auth/userinfo.profile";

  private SensorManager sensorManager;
  private Display display;
  private SensorListener sensorListener;
  private View upView;
  private View leftView;
  private View rightView;
  private View downView;
  public boolean left;
  public boolean right;
  public boolean up;
  public boolean down;
  private Button reconnectButton;
  private Button accountButton;
  private SharedPreferences prefs;
  private AccountManager accountManager;
  private GameAsyncTask gameAsyncTask;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    accountManager = AccountManager.get(this);

    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

    prefs = getSharedPreferences("grits", MODE_PRIVATE);

    sensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);

    display = ((WindowManager) getSystemService(WINDOW_SERVICE)).getDefaultDisplay();

    sensorListener = new SensorListener();

    setContentView(R.layout.wasd);

    upView = (View) findViewById(R.id.button_up);
    leftView = (View) findViewById(R.id.button_left);
    rightView = (View) findViewById(R.id.button_right);
    downView = (View) findViewById(R.id.button_down);

    reconnectButton = (Button) findViewById(R.id.reconnect_button);
    accountButton = (Button) findViewById(R.id.account_button);

    reconnectButton.setOnClickListener(new OnClickListener() {
      @Override
      public void onClick(View v) {
        chooseEndpoint();
      }
    });
    reconnectButton.setText(prefs.getString(PREF_GAME_ORIGIN, ORIGIN_GRITSGAME_APPSPOT_COM));

    accountButton.setOnClickListener(new OnClickListener() {
      @Override
      public void onClick(View v) {
        chooseAccount();
      }
    });
  }

  @Override
  protected void onStart() {
    super.onStart();
    Log.i(TAG, "************* onStart()");
    setAccountFromPref();
  }

  @Override
  protected void onStop() {
    super.onStop();
    Log.i(TAG, "************* onStop()");
    if (gameAsyncTask != null) {
      gameAsyncTask.disconnect();
    }
  }

  @Override
  protected void onResume() {
    super.onResume();
    sensorListener.start();
  }

  @Override
  protected void onPause() {
    super.onPause();
    sensorListener.stop();
  }

  /**
   * Disconnect an existing websocket connection and attempt to reconnect.
   */
  protected void reconnect() {
    Log.i(TAG, "********************* reconnect()");
    if (gameAsyncTask != null) {
      gameAsyncTask.disconnect();
    }
    gameAsyncTask = new GameAsyncTask();
    gameAsyncTask.execute();
  }

  /**
   * Allow the user to select a websocket endpoint to connect to.
   */
  private void chooseEndpoint() {
    AlertDialog.Builder builder = new AlertDialog.Builder(this);
    builder.setTitle("Select an endpoint");
    final String[] origins = new String[] {ORIGIN_GRITSGAME_APPSPOT_COM, ORIGIN_LOCAL};
    builder.setItems(origins, new DialogInterface.OnClickListener() {
      public void onClick(DialogInterface dialog, int which) {
        prefs.edit().putString(PREF_GAME_ORIGIN, origins[which]).apply();
        reconnectButton.setText(origins[which]);
        reconnect();
      }
    });
    AlertDialog dialog = builder.create();
    dialog.setOnCancelListener(new OnCancelListener() {
      @Override
      public void onCancel(DialogInterface dialog) {
        reconnect();
      }
    });

    dialog.show();
  }

  /**
   * Set the current account based on the stored shared preference.
   */
  private void setAccountFromPref() {
    Account[] accounts = accountManager.getAccountsByType("com.google");
    String accountName = prefs.getString(PREF_ACCOUNT_NAME, null);
    for (Account account : accounts) {
      if (account.name.equals(accountName)) {
        setAccount(account);
        return;
      }
    }
    // default to first account
    setAccount(accounts[0]);
  }

  /**
   * Prompt the user for which account they'd like connect with.
   */
  protected void chooseAccount() {
    AlertDialog.Builder builder = new AlertDialog.Builder(this);
    builder.setTitle("Select a Google account");
    final Account[] accounts = accountManager.getAccountsByType("com.google");
    final int size = accounts.length;
    String[] names = new String[size];
    for (int i = 0; i < size; i++) {
      names[i] = accounts[i].name;
    }
    builder.setItems(names, new DialogInterface.OnClickListener() {
      public void onClick(DialogInterface dialog, int which) {
        prefs.edit().putString(PREF_ACCOUNT_NAME, accounts[which].name).apply();
        setAccountFromPref();
      }
    });
    AlertDialog dialog = builder.create();
    dialog.setOnCancelListener(new OnCancelListener() {
      @Override
      public void onCancel(DialogInterface dialog) {
        // if pref is not set, a new dialog will appear
        setAccountFromPref();
      }
    });

    dialog.show();
  }

  /**
   * Set the specified account to be the current one, request new OAuth2 access tokens, and
   * reconnect to the websocket endpoint.
   * 
   * @param account the new account to use
   */
  protected void setAccount(final Account account) {
    accountButton.setText(account.name);

    requestAccessToken(account, PREF_OAUTH2_EMAIL_ACCESS_TOKEN_, SCOPE_USERINFO_EMAIL,
        new Runnable() {
          @Override
          public void run() {

            requestAccessToken(account, PREF_OAUTH2_PROFILE_ACCESS_TOKEN_, SCOPE_USERINFO_PROFILE,
                new Runnable() {
                  @Override
                  public void run() {
                    reconnect();
                  }
                });

          }
        });
  }

  /**
   * Asynchronously request a new OAuth2 access token.
   * 
   * @param account the account for which to request an access token
   * @param prefPrefix the shared prefs prefix under which the access tokens are kept
   * @param scope the OAuth2 scope for which to request a token
   * @param cmd the runnable comamnd to execute once the token has been retrieved
   */
  private void requestAccessToken(final Account account, final String prefPrefix,
      final String scope, final Runnable cmd) {
    invalidateAccessTokens(account, prefPrefix);
    // TODO Update server code to avoid http://en.wikipedia.org/wiki/Confused_deputy_problem
    accountManager.getAuthToken(account, scope, null, this, new AccountManagerCallback<Bundle>() {
      @Override
      public void run(AccountManagerFuture<Bundle> future) {
        try {
          String accessToken = future.getResult().getString(AccountManager.KEY_AUTHTOKEN);
          toast("Got OAuth2 access token for " + account.name + ":\n" + accessToken);
          prefs.edit().putString(prefPrefix + account.name, accessToken).apply();
          cmd.run();
        } catch (OperationCanceledException e) {
          toast("The user has denied you access to the " + scope);
        } catch (Exception e) {
          toast(e.toString());
          Log.w("Exception: ", e);
        }
      }
    }, null);
  }

  /**
   * In order to hedge against potentially expired OAuth2 access token, we simply invalidate all the
   * token we've received for the account.
   * 
   * @param account the account for which to expire access token
   * @param prefPrefix the shared prefs prefix under which the access tokens are kept
   */
  private void invalidateAccessTokens(Account account, String prefPrefix) {
    String accessToken = prefs.getString(prefPrefix + account.name, null);
    if (accessToken != null) {
      accountManager.invalidateAuthToken(account.type, accessToken);
      prefs.edit().remove(prefPrefix + account.name).apply();
    }
  }

  /**
   * An {@link AsyncTask} which is used to request the necessary OAuth2 access tokens, invoke the
   * {@code findGame} grits service, and finally connect to and maintain a websocket connection to
   * the games server. We use an {@link AsyncTask} to avoid running slow network calls on the main
   * UI thread.
   */
  private final class GameAsyncTask extends AsyncTask<Void, String, Void> {
    private IOSocket socket;
    private boolean okayToRun = true;

    protected Void doInBackground(Void... params) {
      String profileAccessToken = prefs.getString(
          PREF_OAUTH2_PROFILE_ACCESS_TOKEN_ + accountButton.getText(), null);
      String emailAccessToken = prefs.getString(
          PREF_OAUTH2_EMAIL_ACCESS_TOKEN_ + accountButton.getText(), null);
      PlayerGame pg = findGame(profileAccessToken, emailAccessToken);
      if (pg == null) {
        // toast message already sent to user, so just return
        return null;
      }

      connect(pg);
      return null;
    }

    /**
     * Convenience method for publishing progress updates which involve exceptions
     * 
     * @param msg the message to display
     * @param e the exception which was raised
     */
    private void publishProgress(String msg, Exception e) {
      Log.e(TAG, msg, e);
      publishProgress(msg + "\n" + e);
    }

    @Override
    protected void onProgressUpdate(String... messages) {
      for (String msg : messages) {
        toast(msg);
      }
    }

    @Override
    protected void onCancelled(Void result) {
      if (socket != null) {
        socket.disconnect();
      }
    }

    /**
     * Acquire the necessary OAuth2 tokens and invoke the grits {@code findGame} service.
     * 
     * @param profileAccessToken OAuth2 access token for the {@value SCOPE_USERINFO_PROFILE} scope
     * @param emailAccessToken OAuth2 access token for the {@value SCOPE_USERINFO_EMAIL} scope
     * @return
     */
    private PlayerGame findGame(String profileAccessToken, String emailAccessToken) {
      JSONObject userInfo = get(HTTPS_WWW_GOOGLEAPIS_COM_OAUTH2_V1_USERINFO, profileAccessToken);
      if (userInfo == null) {
        // toast message already sent to user, so just return
        return null;
      }

      String userID;
      try {
        userID = userInfo.getString("id");
      } catch (JSONException e) {
        publishProgress("failed to extract id from userInfo:" + userInfo, e);
        return null;
      }

      String endpoint = prefs.getString(PREF_GAME_ORIGIN, ORIGIN_GRITSGAME_APPSPOT_COM);

      // Note: the userID is only used in the dev_appserver
      String findGameUrl = endpoint + "/grits/findGame?userID=" + userID;

      JSONObject json = post(findGameUrl, emailAccessToken);
      if (json == null) {
        // toast message already sent to user, so just return
        return null;
      }
      PlayerGame pg = extractPlayerGame(json);
      return pg;
    }

    /**
     * Extract player game data from a response to the Grits {@code findGame} service.
     * 
     * @param json the {@link JSONObject} returned from thr {@code findGame} service.
     * @return the {@link PlayerGame} data or {@ocde null}
     */
    private PlayerGame extractPlayerGame(JSONObject json) {
      try {
        if (!json.has("game")) {
          publishProgress("result does not contain game: " + json.toString(4));
          return null;
        }
        JSONObject game = json.getJSONObject("game");
        String player_game_key = json.getString("player_game_key");
        String userID = json.getString("userID");
        String gameURL = game.getString("gameURL");
        JSONObject game_state = game.getJSONObject("game_state");
        JSONObject players = game_state.getJSONObject("players");
        publishProgress("LOOKING UP userID " + userID);
        String player_name = players.getString(userID);
        if ("TBD".equals(player_name)) {
          publishProgress("Please first login at gritsgame.appspot.com with the same id.");
          return null;
        }
        Log.d(TAG, "player_name = " + player_name);
        gameURL = gameURL.replace("127.0.0.1", LOCAL_IP);
        gameURL = gameURL + player_name;
        Log.d(TAG, "gameUrl = " + gameURL);
        return new PlayerGame(gameURL, player_game_key, player_name);
      } catch (JSONException e) {
        publishProgress("failed to extract player game from json: " + json, e);
        return null;
      }
    }

    /**
     * Send HTTP GET request and return the response as a {@link JSONObject}.
     * 
     * @param url the resource to connect to
     * @param accessToken the OAuth2 bearer access token
     * @return the {@link JSONObject} response
     */
    private JSONObject get(String url, String accessToken) {
      Log.d(TAG, "Connecting to " + url);
      HttpClient httpClient = new DefaultHttpClient();
      HttpGet httpGet = new HttpGet(url);
      Log.d(TAG, "Authorization: Bearer " + accessToken);
      httpGet.addHeader("Authorization", "Bearer " + accessToken);
      ResponseHandler<String> responseHandler = new BasicResponseHandler();
      String json;
      try {
        json = httpClient.execute(httpGet, responseHandler);
      } catch (HttpResponseException e) {
        publishProgress("failed to reach " + url + " due HTTP status " + e.getStatusCode() + ": "
            + e.getMessage());
        return null;
      } catch (Exception e) {
        publishProgress("failed to reach " + url, e);
        return null;
      }
      Log.d(TAG, url + " -> " + json);
      try {
        JSONObject result = (JSONObject) new JSONTokener(json).nextValue();
        return result;
      } catch (JSONException e) {
        publishProgress("failed to digest result as JSON " + json, e);
        return null;
      }
    }

    /**
     * Send HTTP POST request and return the response as a {@link JSONObject}.
     * 
     * @param url the resource to connect to
     * @param accessToken the OAuth2 bearer access token
     * @return the {@link JSONObject} response
     */
    private JSONObject post(String url, String accessToken) {
      Log.d(TAG, "Connecting to " + url);
      HttpClient httpClient = new DefaultHttpClient();
      HttpPost httpPost = new HttpPost(url);
      Log.d(TAG, "Authorization: Bearer " + accessToken);
      httpPost.addHeader("Authorization", "Bearer " + accessToken);
      ResponseHandler<String> responseHandler = new BasicResponseHandler();
      String json;
      try {
        json = httpClient.execute(httpPost, responseHandler);
      } catch (HttpHostConnectException e) {
        publishProgress("failed to reach " + e.getHost() + ": " + e.getMessage());
        return null;
      } catch (HttpResponseException e) {
        publishProgress("failed to reach " + url + " due HTTP status " + e.getStatusCode() + ": "
            + e.getMessage());
        return null;
      } catch (Exception e) {
        Log.e(TAG, "failed to reach " + url, e);
        publishProgress("failed to reach " + url, e);
        return null;
      }
      Log.d(TAG, url + " -> " + json);
      try {
        JSONObject result = (JSONObject) new JSONTokener(json).nextValue();
        return result;
      } catch (JSONException e) {
        publishProgress("failed to digest result as JSON " + json, e);
        return null;
      }
    }

    public void disconnect() {
      cancel(true);
      okayToRun = false;
    }

    private void connect(final PlayerGame pg) {
      socket = new IOSocket(pg.gameURL, new MessageCallback() {
        @Override
        public void on(String event, JSONObject... data) {
          // JSON message; not used
          Log.i(TAG, "on(" + event + ", JSONObject: " + data + ")");
        }

        @Override
        public void onMessage(String message) {
          if (!message.startsWith("ack")) {
            Log.i(TAG, "\nonMessage(String " + message + "):");
          }
          String m = (up ? "Y" : "N") + (left ? "Y" : "N") + (down ? "Y" : "N")
              + (right ? "Y" : "N");
          send(m);
        }

        private void send(String m) {
          if (!okayToRun) {
            socket.disconnect();
            return;
          }
          try {
            socket.send(m);
          } catch (Exception e) {
            publishProgress("failed to send", e);
            // prevent continuous failures
            socket.disconnect();
          }
        }

        @Override
        public void onMessage(JSONObject message) {
          // JSON message; not used
          Log.i(TAG, "onMessage(JSONObject: " + message + ")");
        }

        @Override
        public void onConnect() {
          publishProgress("onConnect(): Connection established - Yay!");
          send("init{ \"player_game_key\": \"" + pg.player_game_key + "\", \"player_name\": \""
              + pg.player_name + "\"}");
        }

        @Override
        public void onDisconnect() {
          publishProgress("onDisconnect(): Boo!");
        }
      });

      try {
        socket.connect();
      } catch (IOException e) {
        publishProgress("failed to connect", e);
      }
    }
  }

  /**
   * Simple bag of properties for passing around.
   */
  private static class PlayerGame {
    private final String gameURL;
    private final String player_game_key;
    private final String player_name;

    public PlayerGame(String gameURL, String player_game_key, String player_name) {
      this.gameURL = gameURL;
      this.player_game_key = player_game_key;
      this.player_name = player_name;
    }
  }

  /**
   * Convenience method for displaying brief messages to the user.
   * 
   * @param msg the message to display
   */
  private void toast(String msg) {
    Toast.makeText(WasdActivity.this, msg, Toast.LENGTH_SHORT).show();
    Log.d(TAG, msg);
  }

  private void updateDirections(float sensorX, float sensorY) {
    if (sensorX > SENSOR_THRESHOLD) {
      left = true;
    } else if (sensorX < SENSOR_THRESHOLD - SENSOR_STICKINESS) {
      left = false;
    }

    if (sensorX < -SENSOR_THRESHOLD) {
      right = true;
    } else if (sensorX > -SENSOR_THRESHOLD + SENSOR_STICKINESS) {
      right = false;
    }

    if (sensorY > SENSOR_THRESHOLD) {
      down = true;
    } else if (sensorY < SENSOR_THRESHOLD - SENSOR_STICKINESS) {
      down = false;
    }

    if (sensorY < -SENSOR_THRESHOLD) {
      up = true;
    } else if (sensorY > -SENSOR_THRESHOLD + SENSOR_STICKINESS) {
      up = false;
    }

    upView.setBackgroundColor(up ? Color.rgb(0, 200, 0) : Color.rgb(0, 80, 0));
    downView.setBackgroundColor(down ? Color.rgb(0, 200, 0) : Color.rgb(0, 80, 0));
    leftView.setBackgroundColor(left ? Color.rgb(0, 200, 0) : Color.rgb(0, 80, 0));
    rightView.setBackgroundColor(right ? Color.rgb(0, 200, 0) : Color.rgb(0, 80, 0));
  }

  /**
   * Class dedicated to listening for accelerometer events. The results are published to few boolean
   * fields in the parent class. We're lazy, so we also update the UI directional indicators here.
   */
  class SensorListener implements SensorEventListener {
    private Sensor accelerometer;
    private float sensorX;
    private float sensorY;

    public SensorListener() {
      accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
    }

    /**
     * Start listening for accelerometer events. Call from {@link Activity#onResume()}.
     */
    public void start() {
      // plenty fast; you can always try SENSOR_DELAY_GAME
      sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_UI);
    }

    /**
     * Start listening for accelerometer events. Call from {@link Activity#onPause()}.
     */
    public void stop() {
      sensorManager.unregisterListener(this);
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
      if (event.sensor.getType() != Sensor.TYPE_ACCELEROMETER)
        return;

      switch (display.getRotation()) {
        case Surface.ROTATION_0:
          sensorX = event.values[0];
          sensorY = event.values[1];
          break;
        case Surface.ROTATION_90:
          sensorX = -event.values[1];
          sensorY = event.values[0];
          break;
        case Surface.ROTATION_180:
          sensorX = -event.values[0];
          sensorY = -event.values[1];
          break;
        case Surface.ROTATION_270:
          sensorX = event.values[1];
          sensorY = -event.values[0];
          break;
      }

      // Log.d(TAG, "rotation=" + display.getRotation() + "; x=" + sensorX + "; y=" + sensorY);
      updateDirections(sensorX, sensorY);
    }

  }

}
