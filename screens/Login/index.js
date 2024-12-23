import React, { useContext, useState, useEffect } from "react";
import * as Animatable from "react-native-animatable";
import Toast from "react-native-toast-message";
import { ProInput, ProText, ProButton, ProSpacer } from "../../components";
import { Ionicons } from "@expo/vector-icons";
import {
  useApi,
  checkEmailisValid,
  checkLengthisValid,
  checkSpaceinValue,
  checkStartWithSpace,
} from "../../hooks";
import { View, Pressable } from "react-native";
import { AuthContext } from "../../context";
import { Logo } from "../../assets";
import { login, checkToken } from "../../api";
import { saveToken } from "../../utils";

import { Container, Header, Footer, Image, ForgotContainer } from "./styles";

const Login = ({ navigation }) => {
  const [isLogged, setIsLogged] = useContext(AuthContext);
  const [saved, setSaved] = useState(false);
  const [show, setShow] = useState(true);

  const { isLoading, run } = useApi({
    deferFn: login,
    onResolve: (data) => {
      saveToken(data);
      setSaved(true);
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  useEffect(() => {
    if (saved) {
      checkToken().then((response) => setIsLogged(true));
    }
  }, [saved]);

  const [{ email, password, error }, setState] = React.useState({
    email: "forms@mail.ru",
    password: "Prospect12@",
    error: null,
  });

  const onChangeInputs = (name, value) => {
    setState((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    if (error === [name]) {
      setState((prevState) => ({
        ...prevState,
        error: null,
      }));
    }
  };

  const handleSubmit = React.useCallback(() => {
    if (email === "" || email === null) {
      setState((prevState) => ({
        ...prevState,
        error: "email",
      }));
      Toast.show({
        type: "error",
        text2: "Email ünvan boş ola bilməz!",
        topOffset: 50,
      });
    } else if (
      !checkEmailisValid(email) ||
      checkSpaceinValue(email) ||
      checkStartWithSpace(email)
    ) {
      setState((prevState) => ({
        ...prevState,
        error: "email",
      }));
      Toast.show({
        type: "error",
        text2: "Email ünvan düz formatda daxil edilməyib!",
        topOffset: 50,
      });
    } else if (password === "" || password === null) {
      setState((prevState) => ({
        ...prevState,
        error: "password",
      }));
      Toast.show({
        type: "error",
        text2: "Şifrə boş ola bilməz!",
        topOffset: 50,
      });
    } else if (
      !checkLengthisValid(password) ||
      checkSpaceinValue(password) ||
      checkStartWithSpace(password)
    ) {
      setState((prevState) => ({
        ...prevState,
        error: "password",
      }));
      Toast.show({
        type: "error",
        text2: "Şifrə düz formatda daxil edilməyib!",
        topOffset: 50,
      });
    } else {
      run({ email, password, deviceToken: "" });
    }
  }, [email, password, error]);

  return (
    <Container>
      <Header>
        <Animatable.View animation="fadeInUp">
          <Image source={Logo} />
        </Animatable.View>
        <ProText variant="heading">Prospect Cloud ERP</ProText>
      </Header>

      <Footer animation="fadeInUp">
        <ProInput
          placeholder="Email ünvanınızı daxil edin"
          icon="email"
          keyboardType="email-address"
          value={email}
          onChange={({ nativeEvent: { text } }) =>
            onChangeInputs("email", text)
          }
          error={error === "email"}
        />
        <ProInput
          placeholder="Şifrəni daxil edin"
          icon="password"
          secure={show}
          value={password}
          onChange={({ nativeEvent: { text } }) =>
            onChangeInputs("password", text)
          }
          error={error === "password"}
          endIcon={
            <Pressable
              // style={[styles.button, styles.buttonClose]}
              onPress={() => setShow(!show)}
            >
              {show ? (
                <Ionicons name="eye-sharp" size={22} color="#767676" />
              ) : (
                <Ionicons name="eye-off-sharp" size={22} color="#767676" />
              )}
            </Pressable>
          }
        />
        <ForgotContainer>
          <ProButton label="Şifrəni unutmusan?" type="skeleton" />
        </ForgotContainer>
        <ProSpacer space="xxl" />
        <ForgotContainer>
          <ProButton
            label="Daxil ol"
            type="primary"
            onClick={handleSubmit}
            loading={isLoading}
          />
        </ForgotContainer>
        <ProSpacer space="m" />
        <ForgotContainer>
          <ProButton label="Qeydiyyatdan keç" type="transparent" />
        </ForgotContainer>
      </Footer>
    </Container>
  );
};

export default Login;
