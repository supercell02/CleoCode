import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useTheme } from '../providers/theme';
import { ErrorMessage, UserMessage, BotMessage } from '../components/message';
import { SessionShell } from '../components/session-shell';
export function NewSession() {
    const navigate = useNavigate();
    const location = useLocation();
    const { colors } = useTheme();

    const state = location.state as { message: string } | undefined;

    useEffect(() => {
        if (!state) {
            navigate('/', { replace: true });
        }
    }, [state, navigate]);

    if (!state?.message) return null;

    return (
        <SessionShell onSubmit={() => {}} inputDisabled loading>
            <UserMessage message={state.message} />
            <BotMessage content="This is a sample bot response to demonstrate the message layout." model="opus-4-6"/>
            <ErrorMessage message="This is a sample error message to demonstrate the error message layout." />
        </SessionShell> 
    );  
}