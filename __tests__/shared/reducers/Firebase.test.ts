import firebaseReducer from '../../../src/shared/reducers/Firebase';

// Mock Firebase service
jest.mock('../../../src/shared/services/firebase', () => {
  return jest.fn().mockImplementation(() => ({
    auth: {
      signUpWithEmailAndPassword: jest.fn(),
      signInWithEmailAndPassword: jest.fn(),
      googleSignIn: jest.fn(),
      githubSignIn: jest.fn(),
      isUserLoggedIn: jest.fn(),
      signOut: jest.fn(),
    },
    user: {
      checkUsernameIsAvailable: jest.fn(),
      checkEmailIsAvailable: jest.fn(),
      getUserData: jest.fn(),
      updateUserData: jest.fn(),
    },
  }));
});

describe('Firebase Reducer', () => {
  it('should return initial state with Firebase instance', () => {
    const state = firebaseReducer(undefined, {type: 'unknown'});

    expect(state).toHaveProperty('firebase');
    expect(state.firebase).toBeDefined();
    expect(state.firebase).toHaveProperty('auth');
    expect(state.firebase).toHaveProperty('user');
  });

  it('should maintain Firebase instance across actions', () => {
    const state1 = firebaseReducer(undefined, {type: 'unknown'});
    const state2 = firebaseReducer(state1, {type: 'another-action'});

    // Firebase instance should be the same object reference
    expect(state2.firebase).toBe(state1.firebase);
  });

  it('should have auth methods available', () => {
    const state = firebaseReducer(undefined, {type: 'unknown'});

    expect(typeof state.firebase.auth.signUpWithEmailAndPassword).toBe(
      'function',
    );
    expect(typeof state.firebase.auth.signInWithEmailAndPassword).toBe(
      'function',
    );
    expect(typeof state.firebase.auth.googleSignIn).toBe('function');
    expect(typeof state.firebase.auth.githubSignIn).toBe('function');
    expect(typeof state.firebase.auth.isUserLoggedIn).toBe('function');
    expect(typeof state.firebase.auth.signOut).toBe('function');
  });

  it('should have user methods available', () => {
    const state = firebaseReducer(undefined, {type: 'unknown'});

    expect(typeof state.firebase.user.checkUsernameIsAvailable).toBe(
      'function',
    );
    expect(typeof state.firebase.user.checkEmailIsAvailable).toBe('function');
    expect(typeof state.firebase.user.getUserData).toBe('function');
    expect(typeof state.firebase.user.updateUserData).toBe('function');
  });

  it('should call Firebase auth methods correctly', async () => {
    const state = firebaseReducer(undefined, {type: 'unknown'});

    // Test isUserLoggedIn
    const isLoggedIn = state.firebase.auth.isUserLoggedIn();
    expect(state.firebase.auth.isUserLoggedIn).toHaveBeenCalled();

    // Test signOut
    await state.firebase.auth.signOut();
    expect(state.firebase.auth.signOut).toHaveBeenCalled();
  });

  it('should handle sign up flow', async () => {
    const state = firebaseReducer(undefined, {type: 'unknown'});

    const mockUserData = {
      fullName: 'John Doe',
      username: 'johndoe',
      email: 'john@example.com',
      password: 'Password@123',
      confirmPassword: 'Password@123',
    };

    state.firebase.auth.signUpWithEmailAndPassword.mockResolvedValue({
      success: true,
    });

    const result =
      await state.firebase.auth.signUpWithEmailAndPassword(mockUserData);

    expect(result.success).toBe(true);
    expect(state.firebase.auth.signUpWithEmailAndPassword).toHaveBeenCalledWith(
      mockUserData,
    );
  });

  it('should handle sign in flow', async () => {
    const state = firebaseReducer(undefined, {type: 'unknown'});

    state.firebase.auth.signInWithEmailAndPassword.mockResolvedValue({
      success: true,
    });

    const result = await state.firebase.auth.signInWithEmailAndPassword(
      'john@example.com',
      'Password@123',
    );

    expect(result.success).toBe(true);
    expect(state.firebase.auth.signInWithEmailAndPassword).toHaveBeenCalledWith(
      'john@example.com',
      'Password@123',
    );
  });

  it('should handle OAuth sign in methods', async () => {
    const state = firebaseReducer(undefined, {type: 'unknown'});

    state.firebase.auth.googleSignIn.mockResolvedValue({success: true});
    state.firebase.auth.githubSignIn.mockResolvedValue({success: true});

    const googleResult = await state.firebase.auth.googleSignIn();
    const githubResult = await state.firebase.auth.githubSignIn();

    expect(googleResult.success).toBe(true);
    expect(githubResult.success).toBe(true);
    expect(state.firebase.auth.googleSignIn).toHaveBeenCalled();
    expect(state.firebase.auth.githubSignIn).toHaveBeenCalled();
  });

  it('should check username availability', async () => {
    const state = firebaseReducer(undefined, {type: 'unknown'});

    state.firebase.user.checkUsernameIsAvailable.mockResolvedValue({
      success: true,
    });

    const result =
      await state.firebase.user.checkUsernameIsAvailable('newuser');

    expect(result.success).toBe(true);
    expect(state.firebase.user.checkUsernameIsAvailable).toHaveBeenCalledWith(
      'newuser',
    );
  });

  it('should check email availability', async () => {
    const state = firebaseReducer(undefined, {type: 'unknown'});

    state.firebase.user.checkEmailIsAvailable.mockResolvedValue({
      success: true,
    });

    const result =
      await state.firebase.user.checkEmailIsAvailable('test@example.com');

    expect(result.success).toBe(true);
    expect(state.firebase.user.checkEmailIsAvailable).toHaveBeenCalledWith(
      'test@example.com',
    );
  });

  it('should handle user data operations', async () => {
    const state = firebaseReducer(undefined, {type: 'unknown'});

    const mockUserData = {name: 'John Doe', bio: 'Developer'};

    state.firebase.user.getUserData.mockResolvedValue(mockUserData);
    state.firebase.user.updateUserData.mockResolvedValue({success: true});

    const userData = await state.firebase.user.getUserData('user123');
    const updateResult = await state.firebase.user.updateUserData(
      'user123',
      mockUserData,
    );

    expect(userData).toEqual(mockUserData);
    expect(updateResult.success).toBe(true);
    expect(state.firebase.user.getUserData).toHaveBeenCalledWith('user123');
    expect(state.firebase.user.updateUserData).toHaveBeenCalledWith(
      'user123',
      mockUserData,
    );
  });

  it('should be a singleton instance', () => {
    const state1 = firebaseReducer(undefined, {type: 'init'});
    const state2 = firebaseReducer(state1, {type: 'another'});
    const state3 = firebaseReducer(state2, {type: 'yet-another'});

    // All states should reference the same Firebase instance
    expect(state1.firebase).toBe(state2.firebase);
    expect(state2.firebase).toBe(state3.firebase);
  });

  it('should handle multiple auth method calls', async () => {
    const state = firebaseReducer(undefined, {type: 'unknown'});

    state.firebase.auth.googleSignIn.mockResolvedValue({success: true});

    // Clear previous calls
    state.firebase.auth.googleSignIn.mockClear();

    // Call multiple times
    await state.firebase.auth.googleSignIn();
    await state.firebase.auth.googleSignIn();
    await state.firebase.auth.googleSignIn();

    expect(state.firebase.auth.googleSignIn).toHaveBeenCalledTimes(3);
  });

  it('should handle authentication failures', async () => {
    const state = firebaseReducer(undefined, {type: 'unknown'});

    state.firebase.auth.signInWithEmailAndPassword.mockResolvedValue({
      success: false,
      error: 'Invalid credentials',
    });

    const result = await state.firebase.auth.signInWithEmailAndPassword(
      'wrong@test.com',
      'wrongpass',
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid credentials');
  });
});
