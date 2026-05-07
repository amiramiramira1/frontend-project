const paginate = async (model, filter = {}, options = {}, populateOptions = null) => {
  const page = Math.max(1, parseInt(options.page) || 1);   // Default: page 1
  const limit = Math.min(50, parseInt(options.limit) || 10); // Default: 10, max: 50
  const skip = (page - 1) * limit;

  // Build the query
  let query = model.find(filter).skip(skip).limit(limit);

  // Apply sorting if provided (e.g. sort=-createdAt means newest first)
  if (options.sort) {
    query = query.sort(options.sort);
  } else {
    query = query.sort({ createdAt: -1 }); // Default: newest first
  }

  // Apply population if provided (e.g. populate ingredient details)
  if (populateOptions) {
    query = query.populate(populateOptions);
  }

  // Run both the data query and count query at the same time
  const [data, total] = await Promise.all([
    query,
    model.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      total,          // Total number of matching documents
      page,           // Current page
      limit,          // Items per page
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

module.exports = paginate;