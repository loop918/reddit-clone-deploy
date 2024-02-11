import axios from "axios";
import { createContext, useContext, useEffect, useReducer } from "react";
import { User } from "../types";

interface state {
    authenticated : boolean;
    user : User | undefined;
    loading : boolean;
}

const StateContext = createContext<state>({
    authenticated: false,
    user: undefined,
    loading: true,
});

const DispatchContext = createContext<any>(null);

interface Action {
    type : string,
    payload : any
}

const reducer = (state: state, {type, payload} : Action) => {
    switch(type) {
        case "LOGIN" : 
            return {
                ...state,
                authenticated: true,
                user: payload
            }
        case "LOGOUT" : 
            return {
                ...state,
                authenticated: false,
                user: null,
            } 
        case "STOP_LOADING" :
            return {
                ...state,
                loading: false,
            }       
        default  :
            throw new Error(`Unknown action type: ${type}`);
    }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    // 초기 state...
    const[state, defaultDispatch] = useReducer(reducer, {
        user :null,
        authenticated : false,
        loading : true
    })

    console.log('state', state);

    const dispatch = (type: string, payload?: any) => {
        defaultDispatch({type, payload});
    }

    // 컴포넌트가 마운트 되자마자 실행...
    useEffect(() => {
        async function loadUser() {
            try {
                const res = await axios.get("/auth/me");
                dispatch("LOGIN", res.data);
            } catch(error) {
                console.log(error);
                
            } finally {
                dispatch("STOP_LOADING");
            }
        }
        loadUser();
    },[]);

    return (
        <DispatchContext.Provider value={dispatch}>
            <StateContext.Provider value={state}>{children}</StateContext.Provider>
        </DispatchContext.Provider>
    )
}

export const useAuthState = () => useContext(StateContext);
export const useAuthDispatch = () => useContext(DispatchContext);