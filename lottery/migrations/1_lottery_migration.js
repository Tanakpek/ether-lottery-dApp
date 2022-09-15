var MyContract = artifacts.require("Lottery");

module.exports = function(deployer) {
  // deployment steps
  deployer.deploy(MyContract);
};
