import styled from 'styled-components/native'
import * as Animatable from 'react-native-animatable'

export const Container = styled.View`
    flex: 1;
    background-color: #37B874;
`
export const Header = styled.View`
    flex: 1;
    align-items: center;
    margin-top: 50px;
`
export const Image = styled.Image`
    width: 90px;
    height: 90px;
    margin: 30px 0 15px 0;
`
export const Footer = styled(Animatable.View)`
    flex: 2;
    background-color: #fff;
    border-top-left-radius: 30px;
    border-top-right-radius: 30px;

    padding: 50px 40px;
`

export const ForgotContainer = styled.View`
    flex-direction: row;
    justify-content: flex-end;
    margin-top: 7px;
`