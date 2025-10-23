describe("ProtocolKolberg", function() {
  it("should initialize the offlineQueue on creation", function() {
    const app = new ProtocolKolberg();
    expect(app.offlineQueue).toBeDefined();
    expect(Array.isArray(app.offlineQueue)).toBe(true);
    expect(app.offlineQueue.length).toBe(0);
  });
});
