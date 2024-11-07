const catchAsyncErrors = (theFunc) => (req, res, next) => {
  Promise.resolve(theFunc(req, res, next))
      .catch((error) => {
          console.error('Async Error:', error);
          next(error);
      });
};

module.exports = catchAsyncErrors;