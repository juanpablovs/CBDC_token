const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

describe("CBDC contract", function () {
	async function deployCBDCFixture() {
		const Cbdc = await ethers.getContractFactory("Cbdc");
		const [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

		const cbdc = await Cbdc.deploy(
			owner.address,
			ethers.utils.parseEther("1000")
		);

		await cbdc.deployed();

		return { Cbdc, cbdc, owner, addr1, addr2 };
	}

	it("should correctly initialize the contract with the controlling party and initial supply", async function () {
		const { cbdc, owner } = await loadFixture(deployCBDCFixture);
		expect(await cbdc.controllingParty()).to.equal(owner.address);
		expect(await cbdc.totalSupply()).to.equal(
			ethers.utils.parseEther("1000")
		);
		expect(await cbdc.balanceOf(owner.address)).to.equal(
			ethers.utils.parseEther("1000")
		);
	});

	describe("updateControllingParty", function () {
		it("should update the controlling party and transfer balance", async function () {
			const { cbdc, owner, addr1 } = await loadFixture(deployCBDCFixture);
			const initialBalanceControllingParty = await cbdc.balanceOf(
				owner.address
			);

			await cbdc.connect(owner).updateControllingParty(addr1.address);

			// Check if the new controlling party is updated
			expect(await cbdc.controllingParty()).to.equal(addr1.address);

			// Check if the balance has been transferred
			expect(await cbdc.balanceOf(addr1.address)).to.equal(
				initialBalanceControllingParty
			);
			// Check if the balance of the former controlling party is zero
			expect(await cbdc.balanceOf(owner.address)).to.equal(0);
		});

		it("Check that the UpdateControllingParty event is emitted", async function () {
			const { cbdc, owner, addr1 } = await loadFixture(deployCBDCFixture);
			await expect(
				cbdc.connect(owner).updateControllingParty(addr1.address)
			)
				.to.emit(cbdc, "UpdateControllingParty")
				.withArgs(owner.address, addr1.address);
		});

		it("should revert if the caller is not the controlling party", async function () {
			const { cbdc, addr1 } = await loadFixture(deployCBDCFixture);
			await expect(
				cbdc.connect(addr1).updateControllingParty(addr1.address)
			).to.be.revertedWithCustomError(cbdc, "NotControllingParty");
		});

		it("should revert if the new controlling party is the zero address", async function () {
			const { cbdc, owner } = await loadFixture(deployCBDCFixture);
			await expect(
				cbdc
					.connect(owner)
					.updateControllingParty(ethers.constants.AddressZero)
			).to.be.revertedWithCustomError(cbdc, "NotToAddressZero");
		});
	});

	describe("updateInterestRate", function () {
		it("should revert if the caller is not the controlling party", async function () {
			const { cbdc, addr1 } = await loadFixture(deployCBDCFixture);
			await expect(
				cbdc.connect(addr1).updateInterestRate(700)
			).to.be.revertedWithCustomError(cbdc, "NotControllingParty");
		});

		it("check that the initial interest rate is 500", async function () {
			const { cbdc } = await loadFixture(deployCBDCFixture);
			expect(await cbdc.interestRateBasisPoints()).to.equal(500);
		});

		it("should update the interest rate basis points to 700", async function () {
			const { cbdc, owner } = await loadFixture(deployCBDCFixture);
			await cbdc.updateInterestRate(700);
			expect(await cbdc.interestRateBasisPoints()).to.equal(700);
		});

		it("should emit the UpdateInterestRate event", async function () {
			const { cbdc } = await loadFixture(deployCBDCFixture);
			const oldInterestRate = await cbdc.interestRateBasisPoints();
			const newInterestRate = 700;
			await expect(cbdc.updateInterestRate(newInterestRate))
				.to.emit(cbdc, "UpdateInterestRate")
				.withArgs(oldInterestRate, newInterestRate);
		});
	});

	describe("increaseMoneySupply", function () {
		it("should revert if the caller is not the controlling party", async function () {
			const { cbdc, addr1 } = await loadFixture(deployCBDCFixture);
			await expect(
				cbdc
					.connect(addr1)
					.increaseMoneySupply(ethers.utils.parseEther("500"))
			).to.be.revertedWithCustomError(cbdc, "NotControllingParty");
		});

		it("check that the initial total supply is 1000", async function () {
			const { cbdc } = await loadFixture(deployCBDCFixture);
			expect(await cbdc.totalSupply()).to.equal(
				ethers.utils.parseEther("1000")
			);
		});

		it("should update the total supply to 1100", async function () {
			const { cbdc } = await loadFixture(deployCBDCFixture);
			await cbdc.increaseMoneySupply(ethers.utils.parseEther("100"));
			expect(
				await cbdc.totalSupply()
			).to.equal(ethers.utils.parseEther("1100"));
		});

		it("should emit the IncreaseMoneySupply event", async function () {
			const { cbdc } = await loadFixture(deployCBDCFixture);
			const oldTotalSupply = await cbdc.totalSupply();
			const inflationAmount = 100;
			await expect(cbdc.increaseMoneySupply(inflationAmount))
				.to.emit(cbdc, "IncreaseMoneySupply")
				.withArgs(oldTotalSupply, inflationAmount);
		});
	});
});
