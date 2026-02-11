/**
 * Umbrella Corp: A.L.I.C.E. Robot Firmware v1.0
 * Target: ESP32 + NEMA17 (A4988 Drivers)
 * 
 * This firmware polls the Pharmacy Dashboard API for move commands.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <AccelStepper.h>

// --- Configuration ---
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://alice.umbrella:5000/api/robot";

// Pins for Stepper Drivers (X and Y axis)
#define X_STEP 12
#define X_DIR  13
#define Y_STEP 14
#define Y_DIR  27

// Initialize Steppers
AccelStepper stepperX(AccelStepper::DRIVER, X_STEP, X_DIR);
AccelStepper stepperY(AccelStepper::DRIVER, Y_STEP, Y_DIR);

long currentJobId = 0;
bool isMoving = false;

void setup() {
  Serial.begin(115200);
  
  // Motor Setup
  stepperX.setMaxSpeed(2000);
  stepperX.setAcceleration(500);
  stepperY.setMaxSpeed(2000);
  stepperY.setAcceleration(500);

  // WiFi Connection
  WiFi.begin(ssid, password);
  Serial.print("Connecting to secure Umbrella Network...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[ROBOT] System Online. ID: ALICE-01");
}

void loop() {
  if (!isMoving) {
    checkNextJob();
  } else {
    executeMove();
  }
  
  // Non-blocking motor movement
  stepperX.run();
  stepperY.run();
}

void checkNextJob() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(String(serverUrl) + "/next-job");
  int httpCode = http.GET();

  if (httpCode == 200) {
    String payload = http.getString();
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, payload);

    if (doc.containsKey("targetX")) {
      long jobId = doc["id"];
      if (jobId != currentJobId) {
        currentJobId = jobId;
        long tx = doc["targetX"];
        long ty = doc["targetY"];
        
        Serial.printf("[ALICE] New Job Received! Target: X=%ld, Y=%ld\n", tx, ty);
        
        stepperX.moveTo(tx);
        stepperY.moveTo(ty);
        isMoving = true;
      }
    }
  }
  http.end();
  delay(1000); // Poll every second
}

void executeMove() {
  if (stepperX.distanceToGo() == 0 && stepperY.distanceToGo() == 0) {
    Serial.println("[ALICE] Target reached. Signaling system...");
    signalCompletion();
    isMoving = false;
  }
}

void signalCompletion() {
  HTTPClient http;
  http.begin(String(serverUrl) + "/job-complete");
  http.addHeader("Content-Type", "application/json");
  
  int httpCode = http.POST("{}");
  if (httpCode > 0) {
    Serial.println("[ALICE] Protcol Finished. Standing by for next command.");
  }
  http.end();
}
