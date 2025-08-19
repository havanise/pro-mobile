import React, { useContext, useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { TenantContext, AuthContext } from "../../context";
import { clearToken } from "../../utils";
import { TabView, TabBar } from "react-native-tab-view";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
  Text,
} from "react-native";
import { DefaultUser, Logo } from "../../assets";
import { Container } from "./styles";
import { fetchMainCurrency } from "../../api/currencies";
import ProfitAndLoss from "./ProfitAndLoss";
import Products from "./Products";
import Recievables from "./Recievables";

const Report = ({ navigation }) => {
  useContext(TenantContext);
  const {
    profile,
    permissionsByKeyValue,
    permissions,
    BUSINESS_TKN_UNIT,
    tableSettings,
    setTableSettings,
  } = useContext(TenantContext);
  const [isLogged, setIsLogged] = useContext(AuthContext);
  const { showActionSheetWithOptions } = useActionSheet();
  const layout = useWindowDimensions();

  const [index, setIndex] = useState(0);
  const [mainCurrency, setMainCurrency] = useState();

  const [isFilterTabBlurred, setIsFilterTabBlurred] = useState(false);
  const [routes, setRoutes] = useState([]);

  const doUserLogOut = () => {
    const options = ["Çıxış"];
    const cancelButtonIndex = 999;
    const containerStyle = {
      maxHeight: 400,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    };

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        containerStyle,
      },
      async (selectedIndex) => {
        if (selectedIndex === 0) {
          return await clearToken()
            .then(async () => {
              setIsLogged(false);
              return true;
            })
            .catch((error) => {
              Alert.alert("Error!", error.message);
              return false;
            });
        }
      }
    );
  };

  useEffect(() => {
    fetchMainCurrency().then((res) => {
      setMainCurrency(res);
    });
  }, []);

  useEffect(() => {
    if (
      permissions.find((item) => item.key === "profit_and_loss_report")
        .permission !== 0 &&
      permissions.find((item) => item.key === "stock_product").permission !== 0
    ) {
      setRoutes([
        { key: "first", title: "Mənfəət və Zərər" },
        { key: "second", title: "Məhsullar" },
        { key: "third", title: "Debitor borc" },
      ]);
      setIndex(0);
    } else if (
      permissions.find((item) => item.key === "profit_and_loss_report")
        .permission !== 0
    ) {
      setRoutes([
        { key: "first", title: "Mənfəət və Zərər" },
        { key: "third", title: "Debitor borc" },
      ]);
      setIndex(0);
    } else if (
      permissions.find((item) => item.key === "stock_product").permission !== 0
    ) {
      setRoutes([
        { key: "second", title: "Məhsullar" },
        { key: "third", title: "Debitor borc" },
      ]);
      setIndex(0);
    }
  }, [permissions]);

  const renderScene = ({ route }) => {
    switch (route.key) {
      case "first":
        return (
          <ProfitAndLoss
            navigation={navigation}
            BUSINESS_TKN_UNIT={BUSINESS_TKN_UNIT}
            profile={profile}
            permissionsByKeyValue={permissionsByKeyValue}
            mainCurrency={mainCurrency}
            tableSettings={tableSettings}
            setTableSettings={setTableSettings}
            permissions={permissions}
          />
        );

      case "second":
        return (
          <Products
            navigation={navigation}
            BUSINESS_TKN_UNIT={BUSINESS_TKN_UNIT}
            profile={profile}
            permissionsByKeyValue={permissionsByKeyValue}
            mainCurrency={mainCurrency}
            tableSettings={tableSettings}
            setTableSettings={setTableSettings}
            onBlur={isFilterTabBlurred}
          />
        );

      case "third":
        return (
          <Recievables
            navigation={navigation}
            BUSINESS_TKN_UNIT={BUSINESS_TKN_UNIT}
            profile={profile}
            permissionsByKeyValue={permissionsByKeyValue}
            mainCurrency={mainCurrency}
            tableSettings={tableSettings}
            setTableSettings={setTableSettings}
            onBlur={isFilterTabBlurred}
          />
        );

      default:
        return null;
    }
  };

  const renderBadge = ({ route }) => {
    if (route.key === "albums") {
      return (
        <View style={styles.badge}>
          <Text style={styles.count}>42</Text>
        </View>
      );
    }
    return null;
  };

  const renderTabBar = (props) => (
    <TabBar {...props} renderBadge={renderBadge} style={styles.tabbar} />
  );

  return (
    <SafeAreaView>
      <Container>
        <View style={styles.inputContainer}>
          <Image source={Logo} />
          <TouchableOpacity
            onPress={() => {
              doUserLogOut();
            }}
          >
            {profile?.attachment?.thumb ? (
              <Image
                src={profile?.attachment?.thumb}
                style={{ borderRadius: 50, width: 40, height: 40 }}
              />
            ) : (
              <Image
                source={DefaultUser}
                style={{ borderRadius: 50, width: 40, height: 40 }}
              />
            )}
          </TouchableOpacity>
        </View>
      </Container>
      <View
        style={{
          height: "100%",
        }}
      >
        {routes.length > 0 && (
          <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            onIndexChange={(newIndex) => {
              if (newIndex !== 1) {
                setIsFilterTabBlurred(true); // Tab is blurred
              } else {
                setIsFilterTabBlurred(false); // Tab is active
              }
              setIndex(newIndex);
            }}
            renderTabBar={renderTabBar}
            swipeEnabled={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  tabbar: {
    backgroundColor: "#37B874",
  },
  inputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
  },
  container: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
});
export default Report;
