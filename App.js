import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { ThemeProvider } from "@shopify/restyle";
import Toast from "react-native-toast-message";
import { AppEntry } from "./navigation";
import { AuthContextProvider, TenantContextProvider } from "./context";
import { theme } from "./utils";

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <SafeAreaProvider>
        <NavigationContainer>
          <AuthContextProvider>
            <TenantContextProvider>
              <ActionSheetProvider>
                <AppEntry />
              </ActionSheetProvider>
              <Toast />
            </TenantContextProvider>
          </AuthContextProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </ThemeProvider>
  );
};

export default App;
