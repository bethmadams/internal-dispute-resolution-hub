export const TRAINING_RESOURCES = [
  { title: "Training library", kind: "Drive folder", url: "https://drive.google.com/drive/folders/19l3-YuUro0T8DC40qGaDckGZ4Vcq2s5b" },
  { title: "Training to set up and lock the room", kind: "Video", url: "https://drive.google.com/file/d/1zhkP_8bdVL0g0KNV-DvN9HJpbrzMLSu6/view" },
  { title: "Training to set up and lock the room (2)", kind: "Video", url: "https://drive.google.com/file/d/1fRYdDSY3kwocyj_WXq4F-jHNrogDTEEe/view" },
];

export const SOP_DOCUMENT_URL = "https://docs.google.com/document/d/1RQntasVV_wc52iDF6r1Ekd2xeztKJJxU80s57uY6ixE/edit?tab=t.0";

export function portalHead(title: string, description: string) {
  const fullTitle = `${title} | eXp Internal Dispute Resolution Portal`;
  return { meta: [
    { title: fullTitle }, { name: "description", content: description },
    { property: "og:title", content: fullTitle }, { property: "og:description", content: description },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] };
}