import React, { useContext, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";
import {
  Dashboard,
  Login,
  Sale,
  Purchase,
  Invoice,
  FinanceTransfer,
  Payments,
  SaleTransfer,
  WritingOff,
} from "../screens";
import { AuthContext, TenantContext } from "../context";
import Modul from "../screens/Modul";
import Report from "../screens/Report";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export const AppEntry = () => {
  const [isLogged, setIsLogged] = useContext(AuthContext);

  useEffect(() => {}, []);

  // const { isPending } = useApi({
  //   promiseFn: checkToken,
  //   onResolve: () => {
  //     setIsLogged(false);
  //   },
  //   onReject: () => {
  //     setIsLogged(false);
  //   },
  // });

  // if (isPending) {
  //   return (
  //     <View>
  //       <Text>Loading...</Text>
  //     </View>
  //   );
  //   // TODO
  //   // Loading component
  // }

  // if (isLogged) {
  // 	return (
  // 		<Authorized />
  // 	);
  // }

  function DashboardTabs() {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            color = focused ? "#6fc99c" : color;

            if (route.name === "VƏP") {
              iconName = focused ? "apps-sharp" : "apps-sharp";
            } else if (route.name === "Modul") {
              iconName = "repeat";
            } else {
              iconName = "bar-chart";
            }

            // You can return any component that you like here!
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#6fc99c",
          headerShown: false,
        })}
      >
        <Tab.Screen name="VƏP" component={Dashboard} />
        <Tab.Screen name="Modul" component={Modul} />
        <Tab.Screen name="Hesabat" component={Report} />
      </Tab.Navigator>
    );
  }

  return (
    <Stack.Navigator>
      {isLogged ? (
        <>
          <Stack.Screen
            name="DashboardTabs"
            component={DashboardTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Sale"
            component={Sale}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Purchase"
            component={Purchase}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Invoice"
            component={Invoice}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="FinanceTransfer"
            component={FinanceTransfer}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Payments"
            component={Payments}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SaleTransfer"
            component={SaleTransfer}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="WritingOff"
            component={WritingOff}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        <Stack.Screen
          name="Login"
          component={Login}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
};
