export function Header() { 
    return (
        <box alignItems="center" justifyContent="center">
            <box justifyContent="center" alignItems="flex-end" flexDirection="row" gap={0.5}>
                <ascii-font text="Cleo" font="tiny" color="grey"/>
                <ascii-font text="Code" font="tiny" />
            </box>
        </box>
    )   
}