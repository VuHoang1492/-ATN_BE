const db = require("../config/database");

module.exports = (req, res, next) => {
    db.getConnection((err, connection) => {
        if (err) {

            console.error('Database connection failed:', err);

            if (['/google/login', '/facebook/login'].includes(req.path)) {
                setTimeout(() => {
                    res.send(
                        ` <script>
                     window.opener.postMessage('FAILED', '*');
                     window.close();
                    </script>`
                    )
                }, 1000)
                return
            }

            res.status(500).send({ msg: 'Có lỗi xảy ra!' })
        } else {
            connection.release(); // Release the connection back to the pool
            next();
        }

    });
}