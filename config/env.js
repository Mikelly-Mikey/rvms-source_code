/**
 * Prints a summary of the current environment configuration to the console.
 */
function printEnvReport() {
  console.log("--- Environment Report ---");
  console.log(`Node Environment: ${process.env.NODE_ENV}`);
  console.log(`Database Type:    ${process.env.DB_TYPE || "sqlite"}`);
  console.log(`Port:             ${process.env.PORT || 3000}`);
  console.log(`App URL:          ${process.env.APP_URL}`);
  console.log(`M-Pesa Mode:      ${process.env.MPESA_MODE || "simulation"}`);
  console.log("--------------------------");
}

module.exports = { printEnvReport };
