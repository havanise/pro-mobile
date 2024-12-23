import styled from 'styled-components/native'
import { theme } from '../../utils'

export const Container = styled.View`
    width: ${theme.sizes.widthInPixel};
    height: ${props => theme.spacing[props.size]};
`