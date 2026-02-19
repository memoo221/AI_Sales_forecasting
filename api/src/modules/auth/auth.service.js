const prisma =require("../../infrastructure/database/prisma");
const { hashPassword, comparePassword } = require("../../common/utils/hash");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} = require("../../common/utils/jwt");

 //doing all in one transcation to ensure data integrity
const register = async ({ companyName, email, password }) => {
  email = email.toLowerCase().trim();
  companyName = companyName.trim();

  try {
    return await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name: companyName },
      });

      const hashedPassword = await hashPassword(password);

      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: "OWNER",
          companyId: company.id,
        },
      });

      const accessToken = generateAccessToken({
        userId: user.id,
        companyId: user.companyId,
        role: user.role,
      });

      const refreshToken = generateRefreshToken({
        userId: user.id,
      });

      await tx.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return { accessToken, refreshToken };
    });
  } catch (error) {
    // Prisma unique constraint error
    if (error.code === "P2002") {
      throw new Error("Email already exists for this company");
    }

    throw error;
  }
};

const REFRESH_TOKEN_DAYS = 7;

const login = async ({ email, password }) => {
  email = email.toLowerCase().trim();

  const user = await prisma.user.findFirst({
    where: { email },
  });

  // Do NOT reveal whether email exists
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isValid = await comparePassword(password, user.password);

  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  const accessToken = generateAccessToken({
    userId: user.id,
    companyId: user.companyId,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
  });

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(
        Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000
      ),
    },
  });

  return { accessToken, refreshToken };
};
const refresh = async (refreshToken) => {
  try {
    const payload = verifyToken(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    const existingToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    // Reuse detection
    if (!existingToken) {
      await prisma.refreshToken.deleteMany({
        where: { userId: payload.userId },
      });

      throw new Error("Refresh token reuse detected. All sessions revoked.");
    }

    // 🔁 Rotate token
    await prisma.refreshToken.delete({
      where: { token: refreshToken },
    });

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    const newAccessToken = generateAccessToken({
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
    });

    const newRefreshToken = generateRefreshToken({
      userId: user.id,
    });

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: new Date(
          Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000
        ),
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (err) {
    throw new Error("Invalid or expired refresh token");
  }
};

const logout = async (refreshToken) => {
  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken },
  });
};

module.exports = {
    register,
    login,
    refresh,
    logout
}   
