import type { Command } from "./types"

export const COMMANDS: Command[]=[
    {
       name:"agents",
        description:"Switch agents",
        value:"/agents" 
    },
    {
        name:"models",
        description:"Select AI models for generation",
        value:"/models"
    },
    {
        name:"sessions",
        description:"Browse and manage your sessions",
        value:"/sessions"
    },
    {
        name:"theme",
        description:"Change the application theme",
        value:"/theme"
    },
    {
        name:"login",
        description:"Sign in with your browser",
        value:"/login"
    },
    {
        name:"logout",
        description:"Sign out of your account",
        value:"/logout"
    },
    {
        name:"upgrade",
        description:"Upgrade your plan",
        value:"/upgrade"
    },
    {
        name:"new",
        description:"Start a new conversation",
        value:"/new"
    },
    {
        name:"usage",
        description:"View usage statistics",
        value:"/usage"
    },
    {
        name:"exit",
        description:"Quit the application",
        value:"/exit",
        action: (ctx) =>{
            ctx.exit()
        }
    }
]