import React, { useState, useEffect, useContext, useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import Toast from "react-native-toast-message";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TenantContext } from "../../context";
import Checkbox from "expo-checkbox";
import { useApi } from "../../hooks";
import {
  ProAsyncSelect,
  ProText,
  ProButton,
  ProFormInput,
  Email,
} from "../../components";
import { useForm } from "react-hook-form";
import {
  createExpensePayment,
  fetchCustomerTypes,
  getCounterparties,
  getEmployees,
  remove_phone_numbers,
} from "../../api";
import { fullDateTimeWithSecond, defaultNumberFormat } from "../../utils";
import { contactCategories, contactTypes } from "../../utils/constants";
import Phone from "../../components/Phone";
import Website from "../../components/Website";
import { createContact } from "../../api/contact";

const math = require("exact-math");

const Contacts = ({
  navigation,
  route,
  fromOperation = false,
  closeModal,
  addContactToSelect = () => {},
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
    setValue,
    watch,
  } = useForm({
    defaultValues: {},
  });

  const [workers, setWorkers] = useState([]);
  const [customerTypes, setCustomerTypes] = useState([]);
  const [expenses, setExpenses] = useState([undefined]);
  const [checked, setChecked] = useState(true);
  const [checkedMobile, setCheckedMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [headContacts, setHeadContacts] = useState([]);
  const [contactInformation, setContactInformation] = useState({
    numbers: [null],
    emails: [null],
    websites: [null],
  });

  const { profile, tenant, BUSINESS_TKN_UNIT } = useContext(TenantContext);

  const onCreateCallBack = (res) => {
    Toast.show({
      type: "success",
      text1: "Əməliyyat uğurla tamamlandı.",
    });
    if (fromOperation) {
      addContactToSelect(res);
      closeModal();
    } else {
      navigation.push("DashboardTabs");
    }
  };

  const checkValues = (values) => {
    const newValues = values.filter(
      (value) => value !== null && value !== undefined && value !== ""
    );
    if (newValues.length === 0) return null;
    return newValues;
  };

  const onSubmit = (values) => {
    const {
      type,
      category_ul,
      name,
      voen,
      priceType,
      managers_ul,
      numbers,
      emails,
      websites,
      address,
      description,
      headContact,
      facebook,
    } = values;

    const newContact = {
      type,
      status: 1,
      category_ul: category_ul,
      headContact: headContact,
      name: name || null,
      position: null,
      voen: voen || null,
      priceType: priceType || null,
      managers_ul: managers_ul || null,
      company: null,
      phoneNumbers_ul: checkValues(numbers, "number"),
      emails_ul: checkValues(emails || []),
      websites_ul: checkValues(websites || []),
      facebook: facebook || null,
      address: address || null,
      description: description || null,
      partnerToken: null,
      socialNetworkIds_ul: [],
      // Requisites data
      requisites_ul: [],
      officialName: null,
      generalDirector: null,
      generalDirectorOccupation: null,
      companyVoen: null,
      bankName: null,
      bankVoen: null,
      bankCode: null,
      correspondentAccount: null,
      settlementAccount: null,
      swift: null,
      // Labels data
      labels_ul: [],
      idCardSeries: null,
      idCardNumber: null,
      idCardPin: null,
      idCardLastName: null,
      idCardFirstName: null,
      idCardPatronymic: null,
      idCardBirthPlace: null,
      idCardBirthday: null,
      idCardMaritalStatus: null,
      idCardMilitaryDuty: null,
      idCardBloodType: null,
      idCardEyeColor: null,
      idCardGender: null,
      idCardHeight: null,
      idCardAddress: null,
      idCardIssuingAuthority: null,
      idCardIssuingDate: null,
      idCardExpirationDate: null,
      isVatPayer: checked,
      hasSpecificPrice: false,
    };

    createContact({ filters: {}, data: newContact })
      .then((res) => {
        onCreateCallBack(res);
      })
      .catch((err) => {
        onFailure(err, values);
      });
  };

  const onFailure = (error, values) => {
    const errKey = error?.response?.data?.error?.errors;
    let errorString = "";
    if (error?.response?.data?.error?.messageKey === "same_phone_number") {
      const already_exists_phone_numbers = Object.keys(errKey.data).map(
        (phoneNumber) => ({
          number: phoneNumber,
          ...errKey.data[phoneNumber],
        })
      );
      already_exists_phone_numbers.forEach(({ number, name }, key) => {
        if (key === 0) {
          errorString += `${number} nömrəsi ${name} əlaqəsində`;
        } else {
          errorString += `, ${number} nömrəsi ${name} əlaqəsində`;
        }
      });

      Alert.alert(
        "Diqqət!",
        `${errorString} artıq qeydiyyatdadır. Əməliyyatı təsdiq etsəniz, nömrə(lər) həmin əlaqə(lər)in tərkibindən silinəcək. Davam etmək istədiyinizə əminsiniz?`,
        [
          {
            text: "Ləğv et",
            onPress: () => console.log("Cancel Pressed"),
            style: "cancel",
          },
          {
            text: "Təsdiq et",
            onPress: () => {
              remove_phone_numbers({
                filters: {
                  ids: already_exists_phone_numbers.map(
                    ({ phoneNumberId }) => phoneNumberId
                  ),
                },
              }).then(() => {
                onSubmit(values);
              });
            },
          },
        ]
      );
    } else if (
      error?.response?.data?.error?.messageKey === "duplicate_phone_number"
    ) {
      Toast.show({
        type: "error",
        text1: "Eyni nömrə təkrar daxil edilə bilməz",
      });
    } else if (
      error?.response?.data?.error?.messageKey === "contact_is_already_exists"
    ) {
      Toast.show({
        type: "error",
        text1: "Bu əlaqə adı artıq mövcuddur",
      });
    }
  };

  const { isLoading: isLoadWorkers, run: runEmployees } = useApi({
    deferFn: getEmployees,
    onResolve: (data) => {
      setWorkers(
        data.map((item) => ({
          ...item,
          label: `${item.name} ${item.lastName}`,
          value: item.id,
        }))
      );
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  const { isLoading: isLoadCustomer, run: runCustomerTypes } = useApi({
    deferFn: fetchCustomerTypes,
    onResolve: (data) => {
      setCustomerTypes(
        data.map((item) => ({
          ...item,
          label: item.name,
          value: item.id,
        }))
      );
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  useEffect(() => {
    runEmployees({
      limit: 20,
      page: 1,
    });
    runCustomerTypes({ limit: 20, page: 1 });
  }, []);
  useEffect(() => {
    if (fromOperation) {
      setValue("category_ul", fromOperation === "sale" ? [1] : [4]);
      handleChange(fromOperation === "sale" ? [1] : [4]);
    }
  }, [fromOperation]);
  useEffect(() => {
    setValue("priceType", 0);
  }, []);

  const handleTotalAmountChange = () => {
    const totalAmount = getValues("expenses")?.reduce(
      (total, current) => math.add(total, Number(current.amount) || 0),
      0
    );
    setValue("paymentAmount", `${totalAmount}`);
  };
  useEffect(() => {
    handleTotalAmountChange();
  }, [expenses]);

  const handleChange = (type) => {
    setLoading(true);
    getCounterparties({
      limit: 1000,
      page: 1,
      categories: type,
    }).then((res) => {
      setLoading(false);
      setHeadContacts(
        res.map((item) => ({ ...item, label: item.name, value: item.id }))
      );
    });
  };

  const handleCheckbox = (checked) => {
    if (checked) {
      setChecked(true);
    } else {
      setChecked(false);
    }
  };

  const handleCheckboxMobile = (checked) => {
    if (checked) {
      setCheckedMobile(true);
    } else {
      setCheckedMobile(false);
    }
  };

  const handleAddValue = (type) => {
    const values = getValues(type);
    if (values.length <= 10) {
      setValue(type, [...values, null]);
      setContactInformation({
        ...contactInformation,
        [type]: [...values, null],
      });
    }
  };

  const handleDeleteValue = (type, id) => {
    const newNumbers = getValues(type).filter((_, index) => index !== id);
    setValue(type, newNumbers);
    setContactInformation({ ...contactInformation, [type]: newNumbers });
  };

  return (
    <SafeAreaProvider>
      <ScrollView>
        <View
          style={{
            paddingTop: 40,
            paddingLeft: 10,
            paddingRight: 10,
            paddingBottom: 40,
          }}
        >
          <ProText variant="heading" style={{ color: "black" }}>
            {"Yeni Əlaqə"}
          </ProText>

          <View
            style={{
              marginTop: 20,
              marginBottom: 20,
              padding: 10,
              borderRadius: 4,
              backgroundColor: "#fff",
              display: "flex",
              gap: 10,
            }}
          >
            {!fromOperation && (
              <Text style={styles.headerText}>Şəxsi məlumatlar</Text>
            )}
            <ProFormInput
              label="Əlaqə adı"
              required
              name="name"
              control={control}
              maxLength={60}
              minLength={3}
            />
            <ProAsyncSelect
              label="Əlaqə tipi"
              data={contactTypes}
              setData={() => {}}
              fetchData={() => {}}
              async={false}
              control={control}
              required
              name="type"
            />
            <ProAsyncSelect
              label="Kateqoriya"
              defaultValue={
                fromOperation ? (fromOperation === "sale" ? [1] : [4]) : []
              }
              isMulti
              data={Object.values(contactCategories)}
              setData={() => {}}
              fetchData={() => {}}
              async={false}
              control={control}
              required
              name="category_ul"
              handleSelectValue={({ list }) => {
                console.log(list, 'list')
                handleChange(list);
              }}
            />
            <ProAsyncSelect
              label="Baş əlaqə"
              data={headContacts}
              setData={() => {}}
              fetchData={() => {}}
              disabled={
                !(
                  watch("category_ul") != undefined &&
                  watch("category_ul")?.length > 0
                ) || loading
              }
              filter={{}}
              async={false}
              control={control}
              name="headContact"
            />
            {!fromOperation && (
              <>
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    marginBottom: 15,
                  }}
                >
                  <Text style={{ marginRight: 5 }}>ƏDV ödəyicisi</Text>
                  <Checkbox
                    onValueChange={(event) => handleCheckbox(event)}
                    value={checked}
                    style={{ marginLeft: "8px" }}
                  />
                </View>

                <ProFormInput
                  label="VÖEN"
                  name="voen"
                  control={control}
                  maxLength={30}
                />
              </>
            )}
            <ProAsyncSelect
              label="Menecer"
              isMulti
              async
              data={workers}
              setData={setWorkers}
              fetchData={getEmployees}
              filter={{ limit: 20, page: 1 }}
              control={control}
              name="managers_ul"
              combineValue
              valueName="lastName"
              searchName={"filters[search]"}
            />
            <ProAsyncSelect
              label="Qiymət tipi"
              data={[
                {
                  label: "Satış",
                  value: 0,
                  id: 0,
                  name: "Satış",
                },
                ...customerTypes,
              ]}
              setData={setCustomerTypes}
              fetchData={fetchCustomerTypes}
              filter={{ limit: 20, page: 1 }}
              async={false}
              control={control}
              name="priceType"
            />

            {!fromOperation && (
              <Text style={styles.headerText}>Əlaqə məlumatları</Text>
            )}

            {contactInformation.numbers.map((email, index) => (
              <Phone
                key={index}
                value={email}
                index={index}
                type="numbers"
                label={"Mobil telefon"}
                checkBox={true}
                checkedMobile={checkedMobile}
                handleCheckboxMobile={handleCheckboxMobile}
                handleAddValue={handleAddValue}
                handleDeleteValue={handleDeleteValue}
                control={control}
                phoneNum
                fromOperation={fromOperation}
              />
            ))}
            {contactInformation.emails.map((email, index) => (
              <Email
                key={index}
                value={email}
                index={index}
                type="emails"
                label={"Email"}
                handleAddValue={handleAddValue}
                handleDeleteValue={handleDeleteValue}
                control={control}
                fromOperation={fromOperation}
              />
            ))}
            {!fromOperation
              ? contactInformation.websites.map((email, index) => (
                  <Website
                    key={index}
                    value={email}
                    index={index}
                    type="websites"
                    label={"Website"}
                    handleAddValue={handleAddValue}
                    handleDeleteValue={handleDeleteValue}
                    control={control}
                  />
                ))
              : null}

            {!fromOperation && (
              <ProFormInput
                label="Facebook istifadəçi adı"
                name="facebook"
                control={control}
                minLength={5}
                regex={/[^a-zA-Z0-9.]/g}
              />
            )}

            <ProFormInput
              label="Ünvan"
              name="address"
              control={control}
              maxLength={500}
            />

            <ProFormInput
              multiline={true}
              label="Əlavə məlumat"
              name="description"
              control={control}
              style={{ textAlignVertical: "top" }}
              maxLength={1000}
            />
          </View>
          <View style={{ display: "flex", flexDirection: "row" }}>
            <ProButton
              label="Təsdiq et"
              type="primary"
              onClick={handleSubmit(onSubmit)}
            />
            {!fromOperation && (
              <ProButton
                label="İmtina"
                type="transparent"
                onClick={() => navigation.push("DashboardTabs")}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#37B874",
  },
});

export default Contacts;
