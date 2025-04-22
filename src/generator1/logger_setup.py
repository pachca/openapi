import logging


def setup_logging(
    logger_name: str,
    file_name: str = 'client_generator.log',
) -> logging.Logger:
    logger = logging.getLogger(logger_name)
    logger.setLevel(logging.DEBUG)
    file_handler = logging.FileHandler(file_name, encoding='utf-8')
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    )
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    return logger
