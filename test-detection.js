// Test script for SuiScope ID detection logic
// Run with: node test-detection.js

// Copy the InputTypeDetector class from script.js
class InputTypeDetector {
    static detect(input) {
        const trimmed = input.trim();
        
        if (!trimmed) {
            return { type: 'unknown', confidence: 0 };
        }

        // Transaction Digest: Base58 format, ~40-50 chars, no 0x prefix
        // Base58 alphabet: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
        if (/^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{40,50}$/.test(trimmed)) {
            // Additional validation: must not start with 0x and must be in typical range
            if (!trimmed.startsWith('0x') && trimmed.length >= 40 && trimmed.length <= 50) {
                return { type: 'transaction', confidence: 0.95 };
            }
        }

        // Address/Object ID: 0x + exactly 64 hex characters = 66 total chars
        if (/^0x[a-fA-F0-9]{64}$/.test(trimmed)) {
            if (trimmed.length === 66) {
                // For addresses and objects, we'll treat them the same initially
                // Could be refined later based on specific patterns if needed
                return { type: 'address', confidence: 0.9 };
            }
        }

        // Shorter hex strings with 0x prefix (less than 64 hex chars) - likely partial or invalid
        if (/^0x[a-fA-F0-9]+$/.test(trimmed)) {
            if (trimmed.length < 66) {
                return { type: 'address', confidence: 0.6 };
            }
        }

        // Base64 Transaction digest: 44 chars ending with = (legacy format)
        if (/^[A-Za-z0-9+/]{43}=$/.test(trimmed)) {
            return { type: 'transaction', confidence: 0.8 };
        }

        // If it starts with 0x but doesn't match expected patterns
        if (trimmed.startsWith('0x')) {
            return { type: 'unknown', confidence: 0.3 };
        }

        return { type: 'unknown', confidence: 0 };
    }
}

// Test cases from requirements
const testCases = [
    {
        input: 'HP2mvVRHsQXMaDqLDkekhgcCTFTYLAXkjvysigJJqk9X',
        expected: 'transaction',
        description: 'Base58 Transaction Digest'
    },
    {
        input: '0x0404875630cc1b09ee2d5dbf8c239f1d05f38d29f1a1499cc1b318e8cbdfb35c',
        expected: 'address',
        description: 'Address (0x + 64 hex chars)'
    },
    {
        input: '0x0000000000000000000000000000000000000000000000000000000000000001',
        expected: 'address',
        description: 'Address/Object (standard format)'
    }
];

// Additional test cases for edge cases
const additionalTests = [
    {
        input: '0x123',
        expected: 'address',
        description: 'Short address (partial)'
    },
    {
        input: '0x',
        expected: 'unknown',
        description: 'Empty hex prefix (should be unknown)'
    },
    {
        input: 'randomstring',
        expected: 'unknown',
        description: 'Random string'
    },
    {
        input: '',
        expected: 'unknown',
        description: 'Empty input'
    },
    {
        input: '0x0404875630cc1b09ee2d5dbf8c239f1d05f38d29f1a1499cc1b318e8cbdfb35cg',
        expected: 'unknown',
        description: 'Invalid hex (contains g)'
    }
];

// Run tests
console.log('🧪 Testing SuiScope ID Detection Logic\n');
console.log('=' .repeat(60));

function runTest(testCase, index) {
    const { input, expected, description } = testCase;
    const result = InputTypeDetector.detect(input);
    const success = result.type === expected;
    
    console.log(`Test ${index + 1}: ${description}`);
    console.log(`Input: ${input}`);
    console.log(`Expected: ${expected}`);
    console.log(`Got: ${result.type} (${Math.round(result.confidence * 100)}% confidence)`);
    console.log(`Status: ${success ? '✅ PASS' : '❌ FAIL'}`);
    console.log('-'.repeat(60));
    
    return success;
}

// Run main test cases
console.log('📋 MAIN TEST CASES (from requirements):\n');
const mainResults = testCases.map(runTest);

console.log('\n📋 ADDITIONAL EDGE CASES:\n');
const additionalResults = additionalTests.map((test, i) => runTest(test, i + testCases.length));

// Summary
const totalTests = testCases.length + additionalTests.length;
const passed = [...mainResults, ...additionalResults].filter(Boolean).length;
const failed = totalTests - passed;

console.log('\n📊 SUMMARY:');
console.log(`Total tests: ${totalTests}`);
console.log(`Passed: ${passed} ✅`);
console.log(`Failed: ${failed} ${failed > 0 ? '❌' : '✅'}`);
console.log(`Success rate: ${Math.round((passed / totalTests) * 100)}%`);

if (failed === 0) {
    console.log('\n🎉 All tests passed! Detection logic is working correctly.');
} else {
    console.log('\n⚠️  Some tests failed. Please review the detection logic.');
}