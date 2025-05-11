package edu.brown.cs32.livecode.dispatcher.stress;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class StressTest {
    public static void main(String[] args) {
        int numThreads = 100; // Number of concurrent users
        ExecutorService executor = Executors.newFixedThreadPool(numThreads);

        for (int i = 0; i < numThreads; i++) {
            final int userId = i;
            executor.submit(() -> {
                try {
                    URL url = new URL("http://localhost:3333/addDebuggingPartner?name=User" + userId + "&email=user"
                            + userId + "@example.com");
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("GET");

                    int responseCode = conn.getResponseCode();
                    System.out.println("User" + userId + " Response Code: " + responseCode);

                    conn.disconnect();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            });
        }

        executor.shutdown();
    }
}