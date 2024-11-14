import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Alert,
} from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [scannedCode, setScannedCode] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    setScannedCode(data);
    setModalVisible(true);
  };

  const saveData = async (key, value) => {
    try {
      const jsonValue = JSON.stringify(value);
      console.log("Guardando datos: ", jsonValue);

      await AsyncStorage.setItem(key, jsonValue);
    } catch (e) {
      console.error("Error saving data: ", e);
    }
  };

  const getData = async (key) => {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      if (jsonValue != null) {
        return JSON.parse(jsonValue);
      }
      return null;
    } catch (e) {
      console.error("Error reading data: ", e);
    }
  };

  const handleConfirmation = async (confirm) => {
    if (confirm) {
      // Get the current date
      const currentDate = new Date().toISOString();

      // Verifica si el código ya está guardado
      const existingCodes = await getData("scanned_codes");

      // If the code already exists, show an alert
      if (
        existingCodes &&
        existingCodes.some((item) => item.code === scannedCode)
      ) {
        Alert.alert("¡Error!", "Este código ya fue guardado.");
      } else {
        // If not, save the code with the date
        const newEntry = { code: scannedCode, date: currentDate };
        let updatedCodes = existingCodes
          ? [...existingCodes, newEntry]
          : [newEntry];

        await saveData("scanned_codes", updatedCodes); // Save the data
        alert(`Código guardado: ${scannedCode}`);
      }
    }

    setScanned(false);
    setModalVisible(false);
    setScannedCode(null);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.loadingText}>Esperando permisos...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>
          No se tienen permisos para usar la cámara
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.overlay}>
        <View style={styles.topOverlay} />
        <View style={styles.centerRow}>
          <View style={styles.sideOverlay} />
          <View style={styles.focusBox} />
          <View style={styles.sideOverlay} />
        </View>
        <View style={styles.bottomOverlay} />
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              Código escaneado: {scannedCode}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => handleConfirmation(true)}
              >
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleConfirmation(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa", // Fondo claro para que se vea bien el contenido
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: "#6200ee", // Color de texto que combina con el indicador
  },
  errorText: {
    fontSize: 20,
    color: "#d32f2f", // Rojo para indicar error
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  centerRow: {
    flexDirection: "row",
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  focusBox: {
    width: "100%",
    height: 200,
    borderColor: "#fff",
    borderWidth: 2,
    backgroundColor: "transparent",
    borderRadius: 10,
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    width: "80%",
  },
  modalText: {
    fontSize: 18,
    marginBottom: 15,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  confirmButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#dc3545",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
