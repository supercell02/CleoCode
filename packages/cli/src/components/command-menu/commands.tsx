import { 
    AgentsDialogContent,
    ModelsDialogContent,
    SessionDialogContent, 
    ThemeDialogContent } 
    from "../dialogs";
import type { Command } from "./types"
import { SUPPORTED_CHAT_MODELS } from "@CleoCode/shared";
export const COMMANDS: Command[]=[
    {
       name:"agents",
        description:"Switch agents",
        value:"/agents" ,
        action: (ctx) => {
            ctx.dialog.open({
                title: "Select agent",
                children: <AgentsDialogContent currentMode={ctx.mode} onSelectMode={ctx.setMode} />
            })
        }
    },
    {
        name:"models",
        description:"Select AI models for generation",
        value:"/models",
        action: (ctx) => {
            ctx.dialog.open({
                title: "Select Model",
                children: <ModelsDialogContent models={SUPPORTED_CHAT_MODELS.map((model) => model.id)} onSelectModel={ctx.setModel} />
            })
        }
    },
    {
        name:"sessions",
        description:"Browse and manage your sessions",
        value:"/sessions",
        action: (ctx) => {
            ctx.dialog.open({
                title: "Sessions",
                children: <SessionDialogContent />
            })
        }
    },
    {
        name:"theme",
        description:"Change the application theme",
        value:"/theme",
        action: (ctx) => {
            ctx.dialog.open({
                title: "Select a Theme",
                children: <ThemeDialogContent />
            })
        },
    },
    {
        name:"login",
        description:"Sign in with your browser",
        value:"/login",
        action: (ctx) => {
            ctx.toast.show({ message: "Opening browser to sign in..." });
        }
    },
    {
        name:"logout",
        description:"Sign out of your account",
        value:"/logout",
        action: (ctx) => {
            ctx.toast.show({ message: "Signed Out..." ,variant: "success"});
        }
    },
    {
        name:"upgrade",
        description:"Buy more credits",
        value:"/upgrade",
        action: (ctx) => {
            ctx.toast.show({ message: "Opening credit checkout..." });
        }
    },
    {
        name:"new",
        description:"Start a new conversation",
        value:"/new",
        action: (ctx) => {
            ctx.navigate("/");
        }
    },
    {
        name:"usage",
        description:"Open billing portal in your browser",
        value:"/usage",
        action: (ctx) => {
            ctx.toast.show({ message: "Opening billing portal..." });
        }
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