const crypto = require('pskcrypto');
const BrickTransformFactory = require("./transforms/BrickTransformFactory");
const transformFactory = new BrickTransformFactory();
const adler32 = require('adler32');

function Brick(config) {
    let rawData;
    let transformedData;
    let hash;
    let transformParameters;
    let transform = transformFactory.createBrickTransform(config);

    this.setConfig = (newConfig) => {
        config = newConfig;
        if (transform) {
            transform.setConfig(newConfig);
        } else {
            transform = transformFactory.createBrickTransform(config);
        }
    };

    this.createNewTransform = () => {
        transform = transformFactory.createBrickTransform(config);
        transformParameters = undefined;
        transformData();
    };

    this.getHash = () => {
        if (!hash) {
            hash = crypto.pskHash(this.getTransformedData()).toString("hex");
        }

        return hash;
    };

    this.getId = () => {
        const seedId = config.getSeedId();
        if (seedId) {
            return seedId;
        }
        return config.getMapDigest();
    };

    this.setId = (id) => {
        config.setSeedId(id);
    };

    this.getSeed = () => {
        return config.getSeed().toString();
    };
    this.getAdler32 = () => {
        return adler32.sum(this.getTransformedData());
    };

    this.setRawData = function (data) {
        rawData = data;
        if (!transform) {
            transformedData = rawData;
        }
    };

    this.getRawData = () => {
        if (rawData) {
            return rawData;
        }

        if (transformedData) {
            if (!transform) {
                return transformedData;
            }

            rawData = transform.applyInverseTransform(transformedData, transformParameters);
            if (rawData) {
                return rawData;
            }

            return transformedData;
        }

        throw new Error("The brick does not contain any data.");
    };

    this.setTransformedData = (data) => {
        transformedData = data;
    };

    this.getTransformedData = () => {
        if (!transformedData) {
            transformData();
        }

        if (transformedData) {
            return transformedData;
        }

        if (rawData) {
            return rawData;
        }

        throw new Error("The brick does not contain any data.");
    };

    this.getTransformParameters = () => {
        if (!transformedData) {
            transformData();
        }
        return transformParameters;
    };

    this.setTransformParameters = (newTransformParams) => {
        if (!newTransformParams) {
            return;
        }

        if (!transformParameters) {
            transformParameters = newTransformParams;
            return;
        }

        Object.keys(newTransformParams).forEach(key => {
            transformParameters[key] = newTransformParams[key];
        });
    };

    this.getRawSize = () => {
        return rawData.length;
    };

    this.getTransformedSize = () => {
        if (!transformedData) {
            return rawData.length;
        }

        return transformedData.length;
    };

//----------------------------------------------- internal methods -----------------------------------------------------
    function transformData() {
        if (!transform) {
            throw new Error("transform undefined");
        }

        if (rawData) {
            transformedData = transform.applyDirectTransform(rawData, transformParameters);
            if (!transformedData) {
                transformedData = rawData;
            }
        }

        transformParameters = transform.getTransformParameters();
    }

}

module.exports = Brick;
