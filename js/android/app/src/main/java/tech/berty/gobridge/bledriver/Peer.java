package tech.berty.gobridge.bledriver;

import java.util.ArrayList;

public class Peer {
    private static final String TAG = "bty.ble.Peer";

    private final String mPeerID;

    private final ArrayList<PeerDevice> mClientDevices = new ArrayList<>();
    private final ArrayList<PeerDevice> mServerDevices = new ArrayList<>();

    public Peer(String peerID) {
        mPeerID = peerID;
    }

    public synchronized String getPeerID() {
        return mPeerID;
    }

    public synchronized void addClientDevice(PeerDevice peerDevice) {
        mClientDevices.add(peerDevice);
    }

    public synchronized void addServerDevice(PeerDevice peerDevice) {
        mServerDevices.add(peerDevice);
    }

    public synchronized void disconnectAndRemoveDevices() {
        for (PeerDevice device : mClientDevices) {
            device.disconnect();
        }
        mClientDevices.clear();

        for (PeerDevice device : mServerDevices) {
            device.disconnect();
        }
        mServerDevices.clear();
    }

    public synchronized PeerDevice getPeerClientDevice() {
        if (mClientDevices.size() > 0) {
            return mClientDevices.get(0);
        }
        return null;
    }

    public synchronized  boolean isClientReady() {
        return mClientDevices.size() > 0;
    }

    public synchronized  boolean isServerReady() {
        return mServerDevices.size() > 0;
    }

    public synchronized boolean isHandshakeSuccessful() {
        return isClientReady() && isServerReady();
    }
}
