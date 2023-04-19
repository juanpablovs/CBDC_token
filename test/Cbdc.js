const { expect } = require('chai');

describe('CBDC initial deployment tests', function () {
	let Cbdc, cbdc, owner, addr1, addr2;

	beforeEach(async function () {
		Cbdc = await ethers.getContractFactory('Cbdc');
		[owner, addr1, addr2, ...addrs] = await ethers.getSigners();

		cbdc = await Cbdc.deploy(owner.address, ethers.utils.parseEther('1000'));
		await cbdc.deployed();
	});

	it('should correctly initialize the contract with the controlling party and initial supply', async function () {
		expect(await cbdc.controllingParty()).to.equal(owner.address);
		expect(await cbdc.totalSupply()).to.equal(ethers.utils.parseEther('1000'));
		expect(await cbdc.balanceOf(owner.address)).to.equal(
			ethers.utils.parseEther('1000'),
		);
    });

    describe('updateControllingParty', function () {
			it('should update the controlling party and transfer balance', async function () {

				await cbdc
					// .connect(owner)
					.updateControllingParty(addr1.address);

				// Check if the new controlling party is updated
				expect(await cbdc.controllingParty()).to.equal(
					addr1.address,
				);
                console.log(await cbdc.controllingParty(),await cbdc.balanceOf(owner.address),
                    await cbdc.balanceOf(addr1.address));
				// Check if the balance has been transferred
				expect(await cbdc.balanceOf(addr1.address)).to.equal(
					ethers.utils.parseEther('1000'),
				);
				expect(await cbdc.balanceOf(owner.address)).to.equal(0);
			});

			it('should revert if the caller is not the controlling party', async function () {
				await expect(
					cbdc
						.connect(addr1)
						.updateControllingParty(addr1.address),
				).to.be.revertedWith('not the controlling party');
			});

			it('should revert if the new controlling party is the zero address', async function () {
				await expect(
					cbdc
						.connect(owner)
						.updateControllingParty(ethers.constants.AddressZero),
				).to.be.revertedWith(
					'New controlling party cannot be the zero address',
				);
			});
		});
});
