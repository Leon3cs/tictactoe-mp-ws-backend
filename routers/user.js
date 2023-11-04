import { Router } from "express";
import { userRepository } from "../repos/user.js";
import { EntityId } from "redis-om";
import { userValidator, user as userSchema } from "../validators/user.js";
import { paramValidator } from "../validators/params.js";
import { HTTP_STATUS } from "../util/http.js";

export const router = new Router();

router.post("/", userValidator, async (req, res, next) => {
  const user = await userRepository.save(req.body);

  res.send({ id: user[EntityId], user });
});

router.get("/:id", paramValidator, async (req, res, next) => {
  const user = await userRepository.fetch(req.params.id);

  const validation = userSchema.validate(user);

  if (!validation.error) {
    res.send(user);
  } else {
    res.status(HTTP_STATUS.NOT_FOUND).send();
  }
});

router.get("/by-socket/:socketId", paramValidator, async (req, res, next) => {
  const user = await userRepository
    .search()
    .where("socketId")
    .eq(req.params.socketId)
    .return.first();

  if (user) {
    res.send(user);
  } else {
    res.status(HTTP_STATUS.NOT_FOUND).send();
  }
});

router.delete("/:id", paramValidator, async (req, res, next) => {
  await userRepository.remove(req.params.id);

  res.status(HTTP_STATUS.OK).json("OK");
});

router.delete(
  "/by-socket/:socketId",
  paramValidator,
  async (req, res, next) => {
    const user = await userRepository
      .search()
      .where("socketId")
      .eq(req.params.socketId)
      .return.first();

    if (user) {
      await userRepository.remove(user[EntityId]);
      res.status(HTTP_STATUS.OK).json("OK");
    } else {
      res.status(HTTP_STATUS.NOT_FOUND).send();
    }
  }
);
