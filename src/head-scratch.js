// Keep the encounter API without changing the prisoner's pose when bats pass.
export function createHeadScratch() {
	return { update() {}, get active() { return false; }, get count() { return 0; } };
}
