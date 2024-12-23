import React from "react";
import { Image } from "react-native";

import { Message, Lock } from "../../assets";

const IconByName = (name) => {
  switch (name) {
    case "email":
      return <Image source={Message} />;
      break;
    case "password":
      return <Image source={Lock} />;
      break;
    default:
      return null;
      break;
  }
};

const ProIcon = ({ name }) => {
  return IconByName(name);
};

export default ProIcon;
