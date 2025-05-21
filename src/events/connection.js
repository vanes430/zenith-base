export default (client, WAStart) => {
  client.ev.on("connection.update", async (update) => {
    const { connection } = update;
    if (connection === "open") {
      console.log("Terhubung ke server");
    } else if (connection === "close") {
      console.log("Koneksi terputus, mencoba koneksi ulang...");
      WAStart();
    }
  });
};
