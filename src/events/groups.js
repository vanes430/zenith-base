import baileys from "baileys";
const { jidNormalizedUser } = baileys;
export default (client, store) => {
  // Group update handler
  client.ev.on("groups.update", (updates) => {
    for (const update of updates) {
      const id = update.id;
      if (store.groupMetadata[id]) {
        store.groupMetadata[id] = {
          ...(store.groupMetadata[id] || {}),
          ...(update || {}),
        };
      }
    }
  });
  // Participants update handler
  client.ev.on("group-participants.update", ({ id, participants, action }) => {
    const metadata = store.groupMetadata[id];
    if (metadata) {
      switch (action) {
        case "add":
          metadata.participants.push(
            ...participants.map((id) => ({
              id: jidNormalizedUser(id),
              admin: null,
            })),
          );
          break;
        case "remove":
          metadata.participants = metadata.participants.filter(
            (p) => !participants.includes(jidNormalizedUser(p.id)),
          );
          break;
        case "promote":
        case "demote":
          for (const participant of metadata.participants) {
            let normalizedId = jidNormalizedUser(participant.id);
            if (participants.includes(normalizedId)) {
              participant.admin = action === "promote" ? "admin" : null;
            }
          }
          break;
      }
    }
  });
};
