module.exports = class SingletonTemplate {
	destroy () {
		throw new Error("Singleton#destroy() not implemented");
	}

	static singleton () {
		throw new Error("Singleton#singleton() not implemented");
	}

	get modulePath () {
		throw new Error("Singleton#modulePath not implemented");
	}
};
