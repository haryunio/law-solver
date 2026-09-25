import { useSettingsStore } from "../../store/useSettingsStore";
import { RichTextContent, type RichTextContentProps } from "./RichTextContent";

/** Explanations and sources share the automatic precedent link preference. */
export function LegalReferenceContent(props: Omit<RichTextContentProps, "precedentLinkProvider">) {
  const provider = useSettingsStore((state) => state.precedentLinkProvider);
  return <RichTextContent {...props} precedentLinkProvider={provider} />;
}
