const {loadFixture} = require('@nomicfoundation/hardhat-network-helpers');
const {expect} = require('chai');

describe('CBDC contract', function () {
	async function deployCBDCFixture() {
		const Cbdc = await ethers.getContractFactory('Cbdc');
		const [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

		const cbdc = await Cbdc.deploy(
			owner.address,
			ethers.utils.parseEther('1000'),
		);

		await cbdc.deployed();

		return {Cbdc, cbdc, owner, addr1, addr2};
	}

	it('should correctly initialize the contract with the controlling party and initial supply', async function () {
		const {cbdc, owner} = await loadFixture(deployCBDCFixture);
		expect(await cbdc.controllingParty()).to.equal(owner.address);
		expect(await cbdc.totalSupply()).to.equal(ethers.utils.parseEther('1000'));
		expect(await cbdc.balanceOf(owner.address)).to.equal(
			ethers.utils.parseEther('1000'),
		);
	});

	describe('updateControllingParty', function () {
		it('should update the controlling party and transfer balance', async function () {
			const {cbdc, owner, addr1} = await loadFixture(deployCBDCFixture);
			const initialBalanceControllingParty = await cbdc.balanceOf(
				owner.address,
			);

			await cbdc.connect(owner).updateControllingParty(addr1.address);

			// Check if the new controlling party is updated
			expect(await cbdc.controllingParty()).to.equal(addr1.address);

			// Check if the balance has been transferred
			expect(await cbdc.balanceOf(addr1.address)).to.equal(
				initialBalanceControllingParty,
			);
			// Check if the balance of the former controlling party is zero
			expect(await cbdc.balanceOf(owner.address)).to.equal(0);
		});

		it('should revert if the caller is not the controlling party', async function () {
			const {cbdc, owner, addr1} = await loadFixture(deployCBDCFixture);
			await expect(
				cbdc.connect(addr1).updateControllingParty(addr1.address),
			).to.be.revertedWith('not the controlling party');
		});

		it('should revert if the new controlling party is the zero address', async function () {
			const {cbdc, owner, addr1} = await loadFixture(deployCBDCFixture);
			await expect(
				cbdc
					.connect(owner)
					.updateControllingParty(ethers.constants.AddressZero),
			).to.be.revertedWith('New controlling party cannot be the zero address');
		});
	});
});
