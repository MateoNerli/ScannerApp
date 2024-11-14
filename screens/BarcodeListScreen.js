import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  Image,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as XLSX from "xlsx";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import Icon from "react-native-vector-icons/FontAwesome";

export default function BarcodeListScreen() {
  const [scannedData, setScannedData] = useState([]);
  const [filterDate, setFilterDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedCode, setSelectedCode] = useState(null);

  const getData = async (key) => {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error("Error reading data: ", e);
      return [];
    }
  };

  const loadData = async () => {
    try {
      const storedData = await getData("scanned_codes");
      if (storedData.length === 0) {
        await AsyncStorage.setItem(
          "scanned_codes",
          JSON.stringify(exampleData)
        );
        setScannedData(exampleData);
      } else {
        setScannedData(storedData);
      }
    } catch (error) {
      console.error("Error al cargar los datos de AsyncStorage", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredData = filterDate
    ? scannedData.filter((item) => item.date.includes(filterDate))
    : scannedData;

  const exportToExcel = async () => {
    if (filteredData.length === 0) {
      Alert.alert("Aviso", "No hay datos para exportar.");
      return;
    }

    try {
      // Prepara los datos con encabezados
      const workSheetData = [["Código", "Fecha"]];
      filteredData.forEach((item) => {
        workSheetData.push([item.code, item.date.split("T")[0]]);
      });

      const workSheet = XLSX.utils.aoa_to_sheet(workSheetData);
      const workBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workBook, workSheet, "Barcodes");

      const excelFile = XLSX.write(workBook, {
        bookType: "xlsx",
        type: "base64",
      });
      s;

      const dateForFile = filterDate || new Date().toISOString().split("T")[0];
      const fileUri = `${FileSystem.documentDirectory}barcodes_${dateForFile}.xlsx`;

      await FileSystem.writeAsStringAsync(fileUri, excelFile, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === "granted") {
        const asset = await MediaLibrary.createAssetAsync(fileUri);
        await MediaLibrary.createAlbumAsync("Excel Files", asset, false);
        Alert.alert("Éxito", `Archivo exportado y guardado en: ${fileUri}`);
      } else {
        Alert.alert(
          "Error",
          "No se otorgaron permisos para acceder a la galería."
        );
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Aviso", "La función de compartir no está disponible.");
      }
    } catch (e) {
      console.error("Error al exportar el archivo: ", e);
      Alert.alert("Error", "Hubo un problema al exportar el archivo.");
    }
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || filterDate;
    setShowDatePicker(false);
    setFilterDate(currentDate ? currentDate.toISOString().split("T")[0] : "");
  };

  const clearFilterDate = () => {
    setFilterDate("");
  };

  const clearData = () => {
    Alert.alert(
      "Confirmación",
      "¿Estás seguro de que deseas vaciar la lista?",
      [{ text: "Cancelar" }, { text: "Sí", onPress: clearAllData }]
    );
  };

  const clearAllData = async () => {
    try {
      await AsyncStorage.removeItem("scanned_codes");
      setScannedData([]);
      Alert.alert("Éxito", "Los datos han sido borrados.");
    } catch (error) {
      console.error("Error al eliminar los datos de AsyncStorage", error);
    }
  };
  const deleteItem = async (code) => {
    try {
      const updatedData = scannedData.filter((item) => item.code !== code);
      setScannedData(updatedData);
      await AsyncStorage.setItem("scanned_codes", JSON.stringify(updatedData));
      Alert.alert("Éxito", "El código ha sido eliminado.");
    } catch (error) {
      console.error("Error al eliminar el elemento", error);
    }
  };

  const handleViewCode = (code) => {
    setSelectedCode(code);
    setShowModal(true);
  };
  return (
    <View style={styles.container}>
      <View style={styles.dateContainer}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateButtonText}>
            {filterDate
              ? `Fecha Seleccionada: ${filterDate}`
              : "Seleccionar Fecha"}
          </Text>
        </TouchableOpacity>
        {filterDate && (
          <TouchableOpacity
            onPress={clearFilterDate}
            style={styles.clearButton}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
        {showDatePicker && (
          <DateTimePicker
            value={filterDate ? new Date(filterDate) : new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
      </View>
      <FlatList
        data={filteredData}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardText}>
              Código: <Text style={styles.code}>{item.code}</Text>
            </Text>
            <Text style={styles.cardText}>
              Fecha: <Text style={styles.date}>{item.date.split("T")[0]}</Text>
            </Text>
            <View style={styles.iconContainer}>
              <TouchableOpacity onPress={() => deleteItem(item.code)}>
                <Icon name="trash" size={24} color="red" style={styles.icon} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>No hay códigos guardados.</Text>
        )}
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={clearData}>
          <Text style={styles.buttonText}>Vaciar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={exportToExcel}>
          <Text style={styles.buttonText}>Exportar a Excel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginHorizontal: 10,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9fafb",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  dateContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  clearButton: {
    height: 40,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    marginBottom: 15,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    transition: "background-color 0.3s ease",
  },

  dateButton: {
    backgroundColor: "#4a90e2",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  dateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  card: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
    flexDirection: "row", // Alinea los elementos en línea
    justifyContent: "space-between", // Espacia los elementos
    alignItems: "center", // Centra verticalmente

    display: "flex",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardText: {
    fontSize: 18,
    color: "#555",
    marginBottom: 5,
  },
  cardContent: {
    flex: 1, // Toma el espacio restante
  },
  cardText: {
    fontSize: 16,
  },
  code: {
    fontWeight: "bold",
  },
  date: {
    color: "gray",
  },
  icon: {
    marginLeft: 10, // Espacio entre el contenido y el ícono
  },
  icon: {
    marginLeft: 10, // Espacio entre el contenido y el ícono
  },

  emptyText: {
    fontSize: 18,
    color: "#999",
    textAlign: "center",
    marginTop: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    backgroundColor: "#4a90e2",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 130,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
