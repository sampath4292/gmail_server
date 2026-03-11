router.get("/", async (req, res) => {
  const query = req.query.q;

  const results = await Email.find({
    $or: [
      { subject: { $regex: query, $options: "i" } },
      { message: { $regex: query, $options: "i" } },
    ],
  });

  res.json(results);
});
