// MODIFIED TO REDUCE LOGGING
package com.clwillingham.socket.io;

import java.io.IOException;
import java.net.URI;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import net.tootallnate.websocket.WebSocketClient;

public class IOWebSocket extends WebSocketClient{
	
	private MessageCallback callback;
	private IOSocket ioSocket;
	private static int currentID = 0;
	private String namespace;

	public IOWebSocket(URI arg0, IOSocket ioSocket, MessageCallback callback) {
		super(arg0);
		this.callback = callback;
		this.ioSocket = ioSocket;
	}


	@Override
	public void onIOError(IOException arg0) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void onMessage(String arg0) {
		IOMessage message = IOMessage.parseMsg(arg0);
		
		switch (message.getType()) {			
		case IOMessage.HEARTBEAT:
			try {
				send("2::");
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			break;
			
		case IOMessage.MESSAGE:
			callback.onMessage(message.getMessageData());
			break;
			
		case IOMessage.JSONMSG:
			try {
				callback.onMessage(new JSONObject(message.getMessageData()));
			} catch (JSONException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			break;
		
		case IOMessage.EVENT:
			try {
				JSONObject event = new JSONObject(message.getMessageData());
				JSONArray args = event.getJSONArray("args");
				JSONObject[] argsArray = new JSONObject[args.length()];
				for (int i = 0; i < args.length(); i++) {
					argsArray[i] = args.getJSONObject(i);
				}
				String eventName = event.getString("name");
				
				callback.on(eventName, argsArray);
			} catch (JSONException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			break;

		case IOMessage.CONNECT:
			ioSocket.onConnect();
			break;
			
		case IOMessage.ACK:
		case IOMessage.ERROR:
		case IOMessage.DISCONNECT:
			//TODO
			break;
		}
	}

	@Override
	public void onOpen() {
		try {
			if (namespace != "")
				init(namespace);
		} catch (IOException e) {
			e.printStackTrace();
		}

		ioSocket.onOpen();
	}
	
	@Override
	public void onClose() {
		ioSocket.onClose();
		ioSocket.onDisconnect();
	}


	public void init(String path) throws IOException{
		send("1::"+path);
	}
	
	public void init(String path, String query) throws IOException{
		this.send("1::"+path+"?"+query);
		
	}
	public void sendMessage(IOMessage message) throws IOException{
		send(message.toString());
	}
	
	public void sendMessage(String message) throws IOException{
		send(new Message(message).toString());
	}
	
	public static int genID(){
		currentID++;
		return currentID;
		
	}

	public void setNamespace(String ns) {
		namespace = ns;
	}
	
	public String getNamespace() {
		return namespace;
	}

}
