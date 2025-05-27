import React, { useContext, useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  StyleSheet,
  Image,
  Text,
  Dimensions,
  TouchableOpacity,
  Alert,
} from "react-native";
import { find, chunk } from "lodash";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { useApi } from "../../hooks";
import Carousel from "react-native-snap-carousel";
import { Container, ButtonContainer, Label, Footer } from "./styles";
import { TenantContext, AuthContext } from "../../context";
import { DefaultUser, Logo } from "../../assets";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { clearToken, getData, saveBusinessUnit } from "../../utils";
import { getSettings, fetchProfileInfo, fetchTenantInfo } from "../../api";
import { fetchAllUserSettings, getBusinessUnit } from "../../api/operation-panel";
import { fetchPermissions } from "../../api/tenant";
import { permissionsList } from "../../utils/permissions";

const windowWidth = Dimensions.get("window").width;

const Dashboard = ({ navigation }) => {
  const [settingMax, setSettingMax] = useState();
  const [settingMin, setSettingMin] = useState();
  const [businessUnitList, setBusinessUnitList] = useState();
  const [isLogged, setIsLogged] = useContext(AuthContext);
  const {
    profile,
    setProfile,
    tenant,
    setTenant,
    tenants,
    setTenants,
    tenantPersonRoles,
    setTenantPersonRoles,
    permissions,
    setPermissions,
    setPermissionsByKeyValue,
    setBusinessUnitId,
    setTableSettings,
    tableSettings,
    setUserSettings
  } = useContext(TenantContext);
  const { showActionSheetWithOptions } = useActionSheet();

  const { isPending } = useApi({
    promiseFn: getBusinessUnit,
    onResolve: (data) => {
      setBusinessUnitList(data);
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  const { isPending: load } = useApi({
    promiseFn: fetchProfileInfo,
    onResolve: (data) => {
      setProfile(data);
    },
    onReject: () => {
      console.log("err");
    },
  });

  const { isPending: loadSetting } = useApi({
    promiseFn: getSettings,
    onResolve: (data) => {
      // const parseData = data && data !== null ? JSON.parse(
      //   data["Unit_Operation-Config"]["columnsOrder"]
      // ): null;
      // const operations = parseData?.operations
      //   ?.filter((operation) => operation.visible)
      //   .map((operation) => operation.dataIndex);

      setSettingMax([
        [
          "transaction_invoice_payment",
          "sales_invoice",
          "return_from_customer_invoice",
          "purchase_invoice",
          "transaction_expense_payment",
          "money_transfer",
          "transfer_invoice",
          "remove_invoice",
          "contact",
        ],
      ]);
      setSettingMin([
        [
          "transaction_invoice_payment",
          "sales_invoice",
          "return_from_customer_invoice",
          "purchase_invoice",
          "transaction_expense_payment",
          "money_transfer",
          "transfer_invoice",
          "remove_invoice",
          "contact",
        ],
      ]);
      // setSettingMax(chunk(operations, 12));
      // setSettingMin(chunk(operations, 9));
      setTableSettings(data);
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  const { isPending: loadSettings } = useApi({
    promiseFn: fetchAllUserSettings,
    onResolve: (data) => {
      setUserSettings(data);
    },
    onReject: () => {
      console.log("err");
    },
  });

  const { isPending: loadTenant } = useApi({
    promiseFn: fetchTenantInfo,
    onResolve: (data) => {
      setTenant(data);
    },
    onReject: () => {
      console.log("err");
    },
  });

  const { isPending: loadPermission } = useApi({
    promiseFn: fetchPermissions,
    onResolve: (data) => {
      const groupedPermissions = data.permissions.map((permission) => ({
        ...permission,
        ...permissionsList[permission.key],
      }));
      const permissions = {};
      groupedPermissions.forEach(
        (permission) => (permissions[permission.key] = permission)
      );
      setPermissions(groupedPermissions);
      setPermissionsByKeyValue(permissions);
    },
    onReject: () => {
      console.log("err");
    },
  });

  const unitOperationsModals = {
    sales_invoice: { label: "Satış", key: 1 },
    purchase_invoice: { label: "Alış", key: 2 },
    // import_purchase: {
    //   label: "İdxal alışı",
    //   key: 3,
    // },
    return_from_customer_invoice: {
      label: "Geri alma",
      key: 4,
    },
    // return_to_supplier_invoice: {
    //   label: "Geri qaytarma",
    //   key: 5,
    // },
    money_transfer: {
      label: "Transfer(Maliyyə)",
      key: 6,
    },
    remove_invoice: { label: "Silinmə", key: 7 },
    // product_decrease_invoice: {
    //   label: "Azaltma",
    //   key: 8,
    // },
    // product_increase_invoice: {
    //   label: "Artırma",
    //   key: 9,
    // },
    transaction_invoice_payment: {
      label: "Qaimə",
      key: 10,
    },
    transaction_expense_payment: {
      label: "Xərclər",
      key: 11,
    },
    salary_payment: { label: "Əməkhaqqı", key: 12 },
    transaction_exchange: { label: "Mübadilə", key: 13 },
    transaction_tenant_person_payment: {
      label: "Təhtəl",
      key: 14,
    },
    transaction_advance_payment: {
      label: "Avans",
      key: 15,
    },
    stock_product: { label: "Məhsul", key: 16 },
    contact: { label: "Əlaqə", key: 17 },
    hrm_working_employees: { label: "Əməkdaş", key: 18 },
    users: { label: "İstifadəçi", key: 19 },
    sales_contract: { label: "Müqavilə", key: 20 },
    production_invoice: { label: "İstehsalat", key: 21 },
    transfer_invoice: {
      label: "Transfer(Ticarət)",
      key: 22,
    },
  };

  const onPress = (key) => {
    const options = businessUnitList?.map((item) => item.name);
    const cancelButtonIndex = 999;
    const containerStyle = {
      maxHeight: 400,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    };

    if (
      profile?.businessUnits?.length === 1 ||
      businessUnitList?.length === 1
    ) {
      switch (key) {
        case 1:
          navigation.push("Sale");
          break;
        case 2:
          navigation.push("Purchase");
          break;
        case 4:
          navigation.push("ReturnFromCustomer");
          break;
        case 6:
          navigation.push("FinanceTransfer");
          break;
        case 7:
          navigation.push("WritingOff");
          break;
        case 10:
          navigation.push("Invoice");
          break;
        case 11:
          navigation.push("Payments");
          break;
        case 22:
          navigation.push("SaleTransfer");
          break;
        default:
          break;
      }
    } else {
      showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          containerStyle,
        },
        (selectedIndex) => {
          if (selectedIndex !== 999) {
            saveBusinessUnit(
              businessUnitList[selectedIndex]?.id === null
                ? "0"
                : businessUnitList[selectedIndex]?.id
            );
            setBusinessUnitId(
              businessUnitList[selectedIndex]?.id === null
                ? "0"
                : businessUnitList[selectedIndex]?.id
            );
            switch (key) {
              case 1:
                navigation.push("Sale");
                break;
              case 2:
                navigation.push("Purchase");
                break;
              case 4:
                navigation.push("ReturnFromCustomer");
                break;
              case 6:
                navigation.push("FinanceTransfer");
                break;
              case 7:
                navigation.push("WritingOff");
                break;
              case 10:
                navigation.push("Invoice");
                break;
              case 11:
                navigation.push("Payments");
                break;
              case 22:
                navigation.push("SaleTransfer");
                break;
              default:
                break;
            }
          }
        }
      );
    }
  };

  const carouselItems = Number(windowWidth) > 395 ? settingMax : settingMin;

  const renderItem = ({ item, index }) => {
    return (
      <View
        style={{
          backgroundColor: "white",
          height: 450,
          padding: 15,
        }}
      >
        <Text
          style={{
            fontWeight: 700,
            fontSize: 20,
            textAlign: "center",
            marginBottom: 30,
          }}
        >
          Vahid Əməliyyat Paneli
        </Text>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            justifyContent: "space-between",
            textAlign: "center",
            flexWrap: "wrap",
            rowGap: 20,
          }}
        >
          {item?.map((operation) => {
            const data = find(
              unitOperationsModals,
              (unitOperation, key) => key === operation
            );
            const permission = find(
              permissions,
              ({ key }) => key === operation
            )?.permission;
            return (
              <View
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: 100,
                }}
              >
                <GestureHandlerRootView>
                  <View
                    style={[
                      styles.buttonBorder,
                      !(permission === 2 && permission) && styles.disabled,
                    ]}
                  >
                    <ButtonContainer
                      style={{ borderRadius: 50 }}
                      onPress={() => {
                        if (!(permission === 2 && permission)) {
                          Toast.show({
                            type: "error",
                            text1:
                              "Bu əməliyyatı yerinə yetirmək üçün sizə səlahiyyətlər verilməyib, zəhmət olmasa inzibatçıya müraciət ediniz",
                          });
                        } else {
                          if (data?.key === 17) {
                            navigation.push("Contacts");
                          } else {
                            onPress(data?.key);
                          }
                        }
                      }}
                      disabled={!(permission === 2 && permission)}
                    >
                      <View
                        accessible
                        accessibilityRole="button"
                        style={{ borderRadius: 50 }}
                      >
                        <Label>+</Label>
                      </View>
                    </ButtonContainer>
                  </View>
                </GestureHandlerRootView>
                <Text style={{ width: 114, textAlign: "center" }}>
                  {data?.label}{" "}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

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

        <Footer>
          <View style={styles.carouselContainer}>
            <Carousel
              // ref={(c) => { this._carousel = c; }}
              data={carouselItems}
              renderItem={renderItem}
              sliderWidth={376}
              itemWidth={376}
            />
          </View>
        </Footer>
      </Container>
      {/* <View>
                
                <ProButton></ProButton>
            </View> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
  },
  carouselContainer: {
    marginTop: 60,
  },
  buttonBorder: {
    borderWidth: 1,
    borderRadius: 20,
    borderColor: "#6fc99c",
    width: 80,
    padding: 20,
  },
  disabled: {
    borderColor: "#cecece",
  },
});

export default Dashboard;
