// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import MenuScreen from "./screens/MenuScreen";
import ScanScreen from "./screens/ScanScreen";
import BarcodeListScreen from "./screens/BarcodeListScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Menu">
        <Stack.Screen name="Menu" component={MenuScreen} />
        <Stack.Screen name="Scan" component={ScanScreen} />
        <Stack.Screen name="Barcodes" component={BarcodeListScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
