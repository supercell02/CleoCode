import { useCallback,} from "react";
import { useDialog } from "../../providers/dialog";
import { DialogSearchList } from "../../providers/dialog/dialog-search-list";
import { Mode } from "@CleoCode/database/enums";
import type { SupportedChatModelId } from "@CleoCode/shared";

type ModelsDialogContentProps = {
    models: SupportedChatModelId[];
    onSelectModel: (mode: SupportedChatModelId) => void;
}

export const ModelsDialogContent = ({ 
    models,
    onSelectModel
}: ModelsDialogContentProps) => {
    const dialog = useDialog();   

    const handleSelect = useCallback(
        (nextModel: SupportedChatModelId) => {
            onSelectModel(nextModel);
            dialog.close();
        },
        [onSelectModel, dialog]
    );

    return (
        <DialogSearchList
            items={models}
            onSelect={handleSelect}
            filterFn={(modelId, query) =>
                modelId.toLowerCase().includes(query.toLowerCase())
            }
            renderItem={(modelId, isSelected) => (
                <text selectable={false} fg={isSelected ? "black" : "white"}>
                    {modelId}
                </text>
            )}
            getKey={(modelId) => modelId}
            placeholder="Search models"
            emptyText="No matching models"
        />
    );
};