import React from 'react';
import { ProIcon } from '../../components'
import { theme } from '../../utils'
import { Container, Input, IconContainer, EndIconContainer } from './styles';

const ProInput = ({
    secure = false,
    placeholder,
    onChange,
    value = null,
    icon = null,
    error,
    rest,
    endIcon = null,
}) => {

    let textInput = React.useRef(null)

    focusedInput = () => {
        textInput.setNativeProps({
            style: { borderColor: `${theme.colors.primary}` }
        })
    }

    return (
        <Container>
            {icon ? <IconContainer><ProIcon name={icon} /></IconContainer> : null}
            <Input
                ref={c => { textInput = c }}
                placeholder={placeholder}
                onChange={onChange}
                secureTextEntry={secure}
                value={value}
                underlineColorAndroid="transparent"
                onPressIn={focusedInput}
                error={error}
                {...rest}
            />
            {endIcon ? <EndIconContainer>{endIcon}</EndIconContainer> : null}
        </Container>
    );
}

export default ProInput;