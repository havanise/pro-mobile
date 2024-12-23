import styled from 'styled-components/native'
import { theme } from '../../utils'

export const Container = styled.View`
    /* border: 1px solid red; */
    position: relative;
    margin-bottom: ${theme.spacing.m};
`

export const Label = styled.Text`
    font-size: 16px;
    line-height: 19px;
    color: ${theme.colors.outline };
`

export const Input = styled.TextInput`
    padding: 19px 0 19px 58px;
    border-radius: ${theme.radius.m};
    border: 1px solid ${props => props.error ? theme.colors.danger : theme.colors.outline};
    color: ${theme.colors.text};
    font-size: 16px;

    ::focus {
        border: 1px solid ${theme.colors.primary}
    }
`

export const IconContainer = styled.View`
    position: absolute;
    top: 16px;
    left: 20px;
`

export const EndIconContainer = styled.View`
position: absolute;
top: 22px;
right: 20px;
`