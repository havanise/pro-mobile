import React, { useState, createContext } from 'react'

const AuthContext = createContext()

const AuthContextProvider = props => {
    const [isLogged, setIsLogged] = useState(false)

    return (
        <AuthContext.Provider value={[isLogged, setIsLogged]}>
            {props.children}
        </AuthContext.Provider>
    )
}

export { AuthContext, AuthContextProvider }