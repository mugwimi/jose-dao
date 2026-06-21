const { ethers } = require("hardhat");

async function main() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Deploying JoseDAO Governance System");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("Deployer :", deployer.address);
  console.log("Balance  :", ethers.formatEther(balance), "ETH\n");

  const INITIAL_SUPPLY = 100_000;

  // Deploy GovernanceToken
  console.log("Deploying GovernanceToken...");
  const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
  const token = await GovernanceToken.deploy(INITIAL_SUPPLY);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ GovernanceToken deployed:", tokenAddress);

  // Deploy JoseDAO
  console.log("\nDeploying JoseDAO...");
  const JoseDAO = await ethers.getContractFactory("JoseDAO");
  const dao = await JoseDAO.deploy(tokenAddress);
  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();
  console.log("✅ JoseDAO deployed:", daoAddress);

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Deployment complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("GovernanceToken :", tokenAddress);
  console.log("JoseDAO         :", daoAddress);
  console.log("Initial supply  :", INITIAL_SUPPLY.toLocaleString(), "JGOV");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("Next steps:");
  console.log("1. Verify GovernanceToken:");
  console.log(`   npx hardhat verify --network sepolia ${tokenAddress} ${INITIAL_SUPPLY}`);
  console.log("2. Verify JoseDAO:");
  console.log(`   npx hardhat verify --network sepolia ${daoAddress} ${tokenAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});