export type Unit = 'cm' | 'inch';

const INCH_TO_CM = 2.54;
const CM_TO_INCH = 1 / 2.54;

export class Measurement {
	constructor(
		public value: number,
		public unit: Unit
	) {}

	toCm(): number {
		return this.unit === 'inch' ? this.value * INCH_TO_CM : this.value;
	}

	toInch(): number {
		return this.unit === 'cm' ? this.value * CM_TO_INCH : this.value;
	}

	add(other: Measurement): Measurement {
		if (this.unit === 'inch') {
			return new Measurement(this.value + other.toInch(), this.unit);
		}
		return new Measurement(this.value + other.toCm(), this.unit);
	}

	subtract(other: Measurement): Measurement {
		if (this.unit === 'inch') {
			return new Measurement(this.value - other.toInch(), this.unit);
		}
		return new Measurement(this.value - other.toCm(), this.unit);
	}

	multiply(factor: number): Measurement {
		return new Measurement(this.value * factor, this.unit);
	}

	divide(divisor: number): Measurement {
		return new Measurement(this.value / divisor, this.unit);
	}

	lessThan(other: Measurement): boolean {
		return this.toCm() < other.toCm();
	}

	equals(other: Measurement): boolean {
		return Math.abs(this.toCm() - other.toCm()) < 0.001;
	}
}

export function cm(value: number): Measurement {
	return new Measurement(value, 'cm');
}

export function inch(value: number): Measurement {
	return new Measurement(value, 'inch');
}
