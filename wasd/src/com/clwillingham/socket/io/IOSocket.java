// MODIFIED TO USE END POINTS IN OUTGOING MESSAGES
// MODIFIED TO REDUCE LOGGING
package com.clwillingham.socket.io;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URL;
import java.util.Scanner;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class IOSocket {
	
	private IOWebSocket webSocket;
	private URL connection;
	private String sessionID;
	private int heartTimeOut;
	private int closingTimeout;
	private String[] protocals;
	private String webSocketAddress;
	private MessageCallback callback;
	
	private boolean connecting;
	private boolean connected;
	private boolean open;
	
	public IOSocket(String address, MessageCallback callback){
		webSocketAddress = address;
		this.callback = callback;
	}
	
	public void connect() throws IOException {
		// check for socket.io namespace
		String namespace = "";
		int i = webSocketAddress.lastIndexOf("/");
		if (webSocketAddress.charAt(i-1) != '/') {
			namespace = webSocketAddress.substring(i);
			webSocketAddress = webSocketAddress.substring(0, i);
		}

		// perform handshake
		String url = webSocketAddress.replace("ws://", "http://");
		URL connection = new URL(url+"/socket.io/1/"); //handshake url
		InputStream stream = connection.openStream();
		Scanner in = new Scanner(stream);
		String response = in.nextLine(); //pull the response
		
		// process handshake response
		// example: 4d4f185e96a7b:15:10:websocket,xhr-polling
		if(response.contains(":")) {
			String[] data = response.split(":");
			setSessionID(data[0]);
			setHeartTimeOut(Integer.parseInt(data[1]));
			setClosingTimeout(Integer.parseInt(data[2]));
			setProtocals(data[3].split(","));
		}
		
		connecting = true;
		webSocket = new IOWebSocket(URI.create(webSocketAddress+"/socket.io/1/websocket/"+sessionID), this, callback);
		webSocket.setNamespace(namespace);
		webSocket.connect();
	}
	
	public void emit(String event, JSONObject... message) throws IOException {
		try {
			JSONObject data = new JSONObject();
			JSONArray args = new JSONArray();
			for (JSONObject arg : message) {
				args.put(arg);
			}
			data.put("name", event);
			data.put("args", args);
			IOMessage packet = new IOMessage(IOMessage.EVENT, webSocket.getNamespace(), data.toString());
			webSocket.sendMessage(packet);
		} catch (JSONException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	public void send(String message) throws IOException {
		IOMessage packet = new IOMessage(IOMessage.MESSAGE, webSocket.getNamespace(), message);
		webSocket.sendMessage(packet);
	}
	
	public synchronized void disconnect() {
		if (connected) {
			try {
				if (open) {
					webSocket.sendMessage(new IOMessage(IOMessage.DISCONNECT, webSocket.getNamespace(), ""));
				}
			} catch (IOException e) {
				e.printStackTrace();
			}
			
			onDisconnect();
		}	
	}

	synchronized void onOpen() {
		open = true;
	}
	
	synchronized void onClose() {
		open = false;
	}
	
	synchronized void onConnect() {
		if (!connected) {
			connected = true;
			connecting = false;
			
			callback.onConnect();
		}
	}
	
	synchronized void onDisconnect() {
		boolean wasConnected = connected;
		
		connected = false;
		connecting = false;
		
		if (open) {
			try {
				webSocket.close();
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			
		}
		
		if (wasConnected) {
			callback.onDisconnect();
			
			//TODO: reconnect
		}
	}

	public void setConnection(URL connection) {
		this.connection = connection;
	}


	public URL getConnection() {
		return connection;
	}


	public void setHeartTimeOut(int heartTimeOut) {
		this.heartTimeOut = heartTimeOut;
	}


	public int getHeartTimeOut() {
		return heartTimeOut;
	}


	public void setClosingTimeout(int closingTimeout) {
		this.closingTimeout = closingTimeout;
	}


	public int getClosingTimeout() {
		return closingTimeout;
	}


	public void setSessionID(String sessionID) {
		this.sessionID = sessionID;
	}


	public String getSessionID() {
		return sessionID;
	}


	public void setProtocals(String[] protocals) {
		this.protocals = protocals;
	}


	public String[] getProtocals() {
		return protocals;
	}

}
