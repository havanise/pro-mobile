import styled from 'styled-components/native'
import * as Animatable from 'react-native-animatable'
import { RectButton } from 'react-native-gesture-handler'

export const Container = styled.View`
    background-color: #37B874;
`
export const Header = styled.View`
    flex-direction: row;
    justify-content: 'space-between';
    padding: 10px;
    background-color: #6fc99c;
`
export const Footer = styled(Animatable.View)`
    justify-content: center;
    align-items: center;
    background-color: #fff;
    height: 100%;
`
export const ButtonContainer = styled(RectButton)`
    padding: 5px 5px;
    width: 35px;
     background-color: ${(props) =>
        props.disabled
          ? '#cecece'
          : 'rgba(85,171,128,.3686274509803922)'};
    align-items: center;
`
export const Label = styled.Text`
    color: #6fc99c;
    font-size: 20px;
`