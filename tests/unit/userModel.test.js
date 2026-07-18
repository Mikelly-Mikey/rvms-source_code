const { User } = require("../../models");

describe("User model instance methods", () => {
  it("exposes getFullName on model instances", () => {
    const user = User.build({ first_name: "Jane", last_name: "Doe" });

    expect(user.getFullName()).toBe("Jane Doe");
  });

  it("exposes findByPk as a compatibility alias", () => {
    expect(typeof User.findByPk).toBe("function");
  });

  it("exposes Sequelize operators through Op", () => {
    const { Op } = require("sequelize");

    expect(Op.between).toBe("$between");
    expect(Op.gte).toBe("$gte");
  });
});
